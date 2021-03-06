

export let isTouchDevice = function(){
	return 'ontouchstart' in document.documentElement
}

/**
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 **/
export let debounce = function(fn, wait, immediate){
	var timeout;
	return function(){
		var context = this, args = arguments;

		var later = function(){
			timeout = null;
			if (!immediate){
				fn.apply(context, args);
			}
		};

		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);

		if (callNow){
			fn.apply(context, args);
		}
	};
};


export let throttle = function(fn, delay){
	let lastCall = 0;
	return function (...args){
		const now = (new Date).getTime();
		if (now - lastCall < delay) {
			return;
		}
		lastCall = now;
		return fn(...args);
	}
}


/**
 * Storage handler
 * All localStorage tasks are handled below. This means we can detect for localStorage issues in one place
 **/

var storage = (function() {
	var uid = new Date;
	var storage;
	var result;
	try {
		(storage = window.localStorage).setItem(uid, uid);
		result = storage.getItem(uid) == uid;
		storage.removeItem(uid);
		return result && storage;
	} catch (exception) {}
}());

/**
 * Get a storage value
 *
 * @param key = string
 * @param default_value = mixed (optional, if localStorage key doesn't exist, return this)
 **/
export let getStorage = function(key, default_value = {}){
	if (storage){
		var value = storage.getItem(key);
		if (value){
			return JSON.parse(value);
		} else {
			return default_value;
		}

	} else {
		console.warn("localStorage not available. Using default value for '"+key+"'.");
		return default_value;
	}
}

/**
 * Set a storage value
 *
 * @param key = string
 * @param value = object
 * @param replace = boolean (optional, completely replace our local value rather than merging it)
 **/
export let setStorage = function(key, value, replace = false){
	if (storage){
		var stored_value = storage.getItem(key);

		// We have nothing to merge with, or we want to completely replace previous value
		if (!stored_value || replace){
			var new_value = value;

		// Merge new value with existing
		} else {
			var new_value = Object.assign(
				{},
				JSON.parse(stored_value),
				value
			);
		}
		storage.setItem(key, JSON.stringify(new_value));
		return;
	} else {
		console.warn("localStorage not available. '"+key+"'' will not perist when you close your browser.");
		return;
	}
}


/**
 * Image sizing
 * We digest all our known image source formats into a universal small,medium,large,huge object
 *
 * @param images = array
 * @return obj
 **/
export let sizedImages = function(images){

	var sizes = {
		small: false,
		medium: false,
		large: false,
		huge: false
	}

	// An array of images has been provided
	if (Array.isArray(images)){

		if (images.length <= 0){
			return sizes;
		}

		for (var i = 0; i < images.length; i++){
			let image = images[i]

			// Mopidy image object
			if (image.__model__ && image.__model__ == 'Image'){

				if (image.width < 400){
					sizes.small = image.url;
				}else if (image.width < 800){
					sizes.medium = image.url;
				}else if (image.width < 1000){
					sizes.large = image.url;
				} else {
					sizes.huge = image.url;
				}

			// Mopidy image string
			} else if (typeof(image) == 'string'){
				sizes.small = image
			
			// spotify-styled images
			} else if (image.width !== undefined){

				if (image.width < 400){
					sizes.small = image.url;
				}else if (image.width < 800){
					sizes.medium = image.url;
				}else if (image.width < 1000){
					sizes.large = image.url;
				} else {
					sizes.huge = image.url;
				}

			// lastfm-styled images
			} else if (image.size !== undefined){
				switch(image.size){
					case 'mega':
					case 'extralarge':
					case 'large':
						sizes.medium = image['#text']
						break;
					case 'medium':
					case 'small':
						sizes.small = image['#text']
						break;
				}
			}
		}

	// An object of images has been provided
	// The Genius avatar object is an example of this 
	} else {
		if (images.small) sizes.small = images.small.url;
		if (images.medium) sizes.medium = images.medium.url;
		if (images.large) sizes.large = images.large.url;
		if (images.huge) sizes.huge = images.huge.url;
	}

	// Inherit images where we haven't been given the appropriate size
	// Ie small duplicated to tiny, large duplicated to medium, etc
	if (!sizes.small){
		if (sizes.medium) sizes.small = sizes.medium
		else if (sizes.large) sizes.small = sizes.large
		else if (sizes.huge) sizes.small = sizes.huge
		else sizes.small = null
	}
	if (!sizes.medium){
		if (sizes.large) sizes.medium = sizes.large
		else if (sizes.huge) sizes.medium = sizes.huge
		else sizes.medium = sizes.small
	}
	if (!sizes.large) sizes.large = sizes.medium;
	if (!sizes.huge) sizes.huge = sizes.large;
	
	return sizes;
}


/**
 * Digest an array of Mopidy image objects into a universal format. We also re-write
 * image URLs to be absolute to the mopidy server (required for proxy setups).
 *
 * @param mopidy = obj (mopidy store object)
 * @param images = array
 * @return array
 **/
export let digestMopidyImages = function(mopidy, images){
	var digested = [];

	for (var i = 0; i < images.length; i++){

		// Image object (ie from images.get)
		if (typeof images[i] === 'object'){
			// Accommodate backends that provide URIs vs URLs
			var url = images[i].url
			if (!url && images[i].uri){
				url = images[i].uri
			}

	        // Amend our URL
	        images[i].url = url		

			// Replace local images to point directly to our Mopidy server
	        if (url && url.startsWith('/images/')){
	            url = '//'+mopidy.host+':'+mopidy.port+url
	        }

	    // String-based image
		} else if (typeof images[i] === 'string'){
			// Replace local images to point directly to our Mopidy server
	        if (images[i].startsWith('/images/')){
	            images[i] = '//'+mopidy.host+':'+mopidy.port+images[i]
	        }
		}

        digested.push(images[i])
	}

	return digested
}


export let generateGuid = function(type = 'numeric'){
	// numeric
	if (type == 'numeric'){
		var date = new Date().valueOf().toString();
		var random_number = Math.floor((Math.random() * 100)).toString();
		return parseInt(date+random_number);
	} else {
		var format = 'xxxxxxxxxx';
		return format.replace(/[xy]/g, function(c){
			var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
}

export let getCurrentPusherConnection = function(connections, connectionid){
	function isCurrentConnection(connection){
		return connection.connectionid == newProps.pusher.connectionid;
	}
	
	var currentConnection = newProps.pusher.connections.find(isCurrentConnection);
	if (!currentConnection ) return false;

	return currentConnection;
}


/**
 * Get a track's icon
 * @param track object
 * @return string
 **/
export let getTrackIcon = function(current_track = false, core = false){
	if (!core) return false
	if (!current_track) return false
	if (typeof(current_track.uri) == 'undefined') return false
	if (typeof(core.tracks[current_track.uri]) === 'undefined') return false
	var track = core.tracks[current_track.uri]
	if (!track.images) return false
	return sizedImages(track.images).small
}


/**
 * Format our album objects into a universal format
 *
 * @param album obj
 * @return album obj
 **/
export let formatAlbum = function(album){
	if (album.release_date !== undefined){
		album.date = album.release_date;
	}
	return album;
}


/**
 * Format tracks into our universal format
 *
 * @param tracks = object or array of objects
 * @return array
 **/
export let formatTracks = function(tracks){

	if (!tracks || tracks === undefined){
		return null;
	}

	// Handle single records
	var singular = false;
	if (tracks.constructor !== Array){
		tracks = [tracks];
		singular = true;
	}

    var formatted = [];
    for (var i = 0; i < tracks.length; i++){

    	// Nested track object (eg in spotify playlist)
    	if (tracks[i].track && isObject(tracks[i].track)){
    		var track = Object.assign({}, tracks[i].track);

    		// Copy supporting values
    		if (tracks[i].added_by){
    			track.added_by = tracks[i].added_by;
    		}
    		if (tracks[i].added_at){
    			track.added_at = tracks[i].added_at;
    		}
    		if (tracks[i].tlid){
    			track.tlid = tracks[i].tlid;
    		}

    	} else {
    		var track = Object.assign({}, tracks[i]);
    	}

    	if (track.duration_ms){
    		track.duration = track.duration_ms;
    	} else if (track.length){
    		track.duration = track.length;
    	}

        if (track.track_no){
        	track.track_number = track.track_no;
        } else if (track.track_number){
        	track.track_number = track.track_number;
        }

        if (track.disc_no){
        	track.disc_number = track.disc_no;
        }

        if (track.release_date){
        	track.date = track.release_date;
        }

	    // Copy images from albums (if applicable)
	    if (track.album && track.album.images){
	    	if (!track.images || track.images.length > 0){
	    		track.images = track.album.images;
	    	}
	    }

        formatted.push(track);
    }

    if (singular){
    	return formatted[0];
    } else {
    	return formatted;
    }
}




/**
 * Figure out a URI's source namespace
 * @param uri = string
 **/
export let uriSource = function(uri){
	if (!uri){
		return false;
	}
    var exploded = uri.split(':');
    return exploded[0]
}

export let sourceIcon = function(uri,source = null){
	if (uri) source = uriSource(uri)
	switch(source){

		case 'local':
		case 'm3u':
			return 'folder'

		case 'gmusic':
			return 'google'

		case 'podcast':
		case 'podcast+file':
		case 'podcast+http':
		case 'podcast+https':
		case 'podcast+itunes':
			return 'podcast'

		case 'tunein':
		case 'somafm':
		case 'dirble':
			return 'microphone'

		default:
			return source
	}
}



/**
 * Get an element from a URI
 * @param element = string, the element we wish to extract
 * @param uri = string
 **/
export let getFromUri = function(element, uri = ""){
    var exploded = uri.split(':');
    var namespace = exploded[0]

    switch (element){
    	case 'mbid':
	        var index = exploded.indexOf('mbid')
	        if (index > -1 ) return exploded[index+1]
	        break

    	case 'artistid':
    		if (exploded[1] == 'artist'){
    			return exploded[2]
    		}
    		break

    	case 'albumid':
    		if (exploded[1] == 'album'){
    			return exploded[2]
    		}
    		break

    	case 'playlistid':
    		if (exploded[1] == 'playlist'){
    			return exploded[2]
    		} else if (exploded[1] == 'user' && exploded[3] == 'playlist'){
    			return exploded[4]
    		}
    		break

    	case 'playlistowner':
    		if (exploded[1] == 'user' && exploded[3] == 'playlist'){
    			return exploded[2]
    		}
    		break

    	case 'trackid':
    		if (exploded[1] == 'track'){
    			return exploded[2]
    		}
    		break

    	case 'userid':
    		if (exploded[1] == 'user'){
    			return exploded[2]
    		}
    		break

    	case 'genreid':
    		if (exploded[1] == 'genre'){
    			return exploded[2]
    		}
    		break

    	case 'seeds':
    		if (exploded[1] == 'discover'){
    			return exploded[2]
    		}
    		break

    	case 'searchtype':
    		if (exploded[0] == "search"){
				return exploded[1];
    		}
    		break

    	case 'searchterm':
    		if (exploded[0] == "search"){
				return exploded[2];
    		}
    		break
    }
    return null
}

/**
 * Identify what kind of asset a URI is (playlist, album, etc)
 * @param uri = string
 * @return string
 **/
export let uriType = function(uri){
    var exploded = uri.split(':')

    if (exploded[0] == 'm3u'){
    	return 'playlist'
    }

    if (exploded[0] == 'iris'){
    	switch (exploded[1]){
	    	case 'search':
	    	case 'discover':
	    	case 'browse':
	    		return exploded[1];
	    		break;
	    }
    }

    switch (exploded[1]){
    	case 'track':
    	case 'artist':
    	case 'album':
    	case 'playlist':
    	case 'genre':
    		return exploded[1]
    		break

    	case 'user':
    		if (exploded.length > 3 && exploded[3] == 'playlist'){
    			return 'playlist'
    		}
    		return exploded[1]
    		break
    }

    return null;
}


/**
 * Convert a raw URI into a object index-friendly format. Primarily used for loading local playlists
 * @param $uri = string
 * @return string
 **/
export let indexFriendlyUri = function (uri){
	var output = encodeURI(uri)
	output = output.replace("'",'%27')
	return output
}


/**
 * Digest an array of objects and pull into simple array of one property
 * 
 * @param property = string
 * @param items = Array
 * @return Array
 **/
export let arrayOf = function(property, items){
	let array = []
	for (let i = 0; i < items.length; i++){
		array.push(items[i][property])
	}
	return array
}


/**
 * Merge duplicated items in an array
 *
 * @param list Array the unclean array
 * @param key string = the unique key (id, uri, tlid, etc)
 **/
export let mergeDuplicates = function(list, key){
	var clean_list = [];
	var keyed_list  = {};

	for(var i in list){
		var item = list[i]
		if (item[key] in keyed_list){
			item = Object.assign({}, keyed_list[item[key]], item)
		}
		keyed_list[item[key]] = item;
	}

	for(i in keyed_list){
		clean_list.push(keyed_list[i]);
	}

	return clean_list;
}


/**
 * Remove duplicate items in a simple array
 *
 * @param list Array the unclean array
 **/
export let removeDuplicates = function(array){
	var unique = [];

	for (var i in array){
		if (unique.indexOf(array[i]) <= -1){
			unique.push(array[i])
		}
	}

	return unique;
}


/**
 * Apply a partial text search on an array of objects
 *
 * @param field = string (the field we're to search)
 * @param value = string (the value to find)
 * @param array = array of objects to search
 * @param singular = boolean (just return the first result)
 * @return array
 **/
export let applyFilter = function(field, value, array, singular = false){
	var results = [];

	for (var i = 0; i < array.length; i++){
		if (array[i][field] && String(array[i][field]).toLowerCase().includes(String(value).toLowerCase())){
			if (singular){
				return array[i];
			} else {
				results.push(array[i]);
			}
		}
	}

	return results;
}


/**
 * Convert a list of indexes to a useable range
 * We ignore stragglers, and only attend to the first 'bunch' of consecutive indexes
 * 
 * @param indexes array of int
 **/
export let createRange = function (indexes){

	// sort our indexes smallest to largest
	function sortAsc(a,b){
        return a - b
    }
    indexes.sort(sortAsc);

    // iterate indexes to build the first 'bunch'
    var first_bunch = []
    var previous_index = false
    for(var i = 0; i < indexes.length; i++){
        if (!previous_index || previous_index == indexes[i]-1){
            first_bunch.push(indexes[i])
            previous_index = indexes[i]
        }
        // TODO: break when we find an integer step for better performance
    }

    return {
    	start: first_bunch[0],
    	length: first_bunch.length
    }
}



/**
 * Sort an array of objects
 * @param array = array to sort
 * @param property = string to sort by
 * @param reverse = boolean
 * @param sort_map = array of value ordering (rather than alphabetical, numerical, etc)
 * @return array
 **/
export let sortItems = function (array, property, reverse = false, sort_map = null){

	function compare(a,b){

		var a_value = a;
		var a_property_split = property.split('.');
		for (var i = 0; i < a_property_split.length; i++){
			if (typeof(a_value[a_property_split[i]]) === 'undefined'){
				a_value = false;
				break;
			} else {
				a_value = a_value[a_property_split[i]];
			}
		}

		var b_value = b;
		var b_property_split = property.split('.');
		for (var i = 0; i < b_property_split.length; i++){
			if (typeof(b_value[b_property_split[i]]) === 'undefined'){
				b_value = false;
				break;
			} else {
				b_value = b_value[b_property_split[i]];
			}
		}

		// Sorting by URI as a reference for sorting by uri source (first component of URI)
		if (property == 'uri'){
			a_value = uriSource(a_value);
			b_value = uriSource(b_value);
		}

		// Map sorting
		// Use the index of the string as a sorting mechanism
		if (sort_map){

			var a_index = sort_map.indexOf(a_value+':');
			var b_index = sort_map.indexOf(b_value+':');
			if (a_index < b_index) return 1;
			if (a_index > b_index) return -1;

		// Boolean sorting
		} else if (typeof(a_value) === 'boolean'){
			if (a_value && !b_value) return -1;
			if (!a_value && b_value) return 1;
			return 0

		// Alphabetic sorting
		} else if (typeof(a_value) === 'string'){
			if (!a_value || !b_value ) return 0;
			if (a_value.toLowerCase() > b_value.toLowerCase()) return 1;
			if (a_value.toLowerCase() < b_value.toLowerCase()) return -1;
			return 0

		// Numeric sorting
		} else {
			if (parseInt(a_value) > parseInt(b_value)) return 1;
			if (parseInt(a_value) < parseInt(b_value)) return -1;
			return 0
		}
	}

	var sorted = Object.assign([], array.sort(compare));
	if (reverse){
		sorted.reverse();
	}
	return sorted;
}

/**
 * Shuffle items in place
 *
 * @param Array items
 * @return Array
 **/
export let shuffle = function(array){
    var j, x, i;
    for (i = array.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = array[i];
        array[i] = array[j];
        array[j] = x;
    }
    return array;
}

/**
 * Figure out if a value is a number
 * @param value = mixed
 * @return boolean
 **/
export let isNumeric = function (value){
	return !isNaN(parseFloat(value)) && isFinite(value)
}


/** 
 * Figure out if a value is an object
 * @param value = mixed
 * @return boolean
 **/
export let isObject = function(value){
	return value instanceof Object && value.constructor === Object;
}


/**
 * Detect if an item is in the loading queue. We simply loop all load items to
 * see if any items contain our searched key.
 *
 * TODO: Explore performance of this
 * TODO: Allow wildcards
 *
 * @param load_queue = obj (passed from store)
 * @param key = string (the string to lookup)
 * @return boolean
 **/
export let isLoading = function(load_queue = [], keys = []){

	// Loop all of our load queue items
	for (var load_queue_key in load_queue){

		// Make sure it's not a root object method
		if (load_queue.hasOwnProperty(load_queue_key)){

			// Loop all the keys we're looking for
			for (var i = 0; i < keys.length; i++){
				if (load_queue[load_queue_key].includes(keys[i])){
					return true
				}
			}
		}
	}
	return false
}


/**
 * Is this app running from the hosted instance?
 * For example the GitHub-hosted UI
 *
 * @param Array hosts = valid hosted domain names
 * @return Boolean
 **/
export let isHosted = function(hosts = ['jaedb.github.io']){
	var hostname = window.location.hostname;
	return hosts.includes(hostname);
}



/**
 * Get indexed record(s) by URI from our asset index
 *
 * @param store = obj
 * @param uris = mixed (array or string)
 * @return array
 **/
export let getIndexedRecords = function(index, uris){
	var records = []

	// Wrap in array, if we've only got one URI
	if (!uris instanceof Array){
		uris = [uris]
	}

	for (var i = 0; i < uris.length; i++){
		if (index.hasOwnProperty(uris[i])){
			records.push(index[uris[i]])
		}
	}

	return records
}


/**
 * Uppercase-ify the first character of a string
 *
 * @param string = string
 * @return string
 **/
export let titleCase = function(string){
    return string.charAt(0).toUpperCase() + string.slice(1)
}
