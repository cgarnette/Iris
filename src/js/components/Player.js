
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { Link } from 'react-router'

import FontAwesome from 'react-fontawesome'
import ProgressSlider from './ProgressSlider'
import ArtistSentence from './ArtistSentence'
import Thumbnail from './Thumbnail'

import * as mopidyActions from '../services/mopidy/actions'

class Player extends React.Component{

	constructor(props) {
		super(props);
	}

	renderPlayButton(){
		var button = <a onClick={() => this.props.mopidyActions.play()}><FontAwesome name="play" /> </a>
		if( this.props.mopidy.state == 'playing' ){
			button = <a onClick={() => this.props.mopidyActions.pause()}><FontAwesome name="pause" /> </a>
		}
		return button;
	}

	renderConsumeButton(){
		var button = <a onClick={() => this.props.mopidyActions.instruct('tracklist.setConsume', [true])}><FontAwesome name="fire" /></a>
		if( this.props.mopidy.consume ){
			button = <a className="active" onClick={() => this.props.mopidyActions.instruct('tracklist.setConsume', [false])}><FontAwesome name="fire" /></a>
		}
		return button;
	}

	renderRandomButton(){
		var button = <a onClick={() => this.props.mopidyActions.instruct('tracklist.setRandom', [true])}><FontAwesome name="random" /></a>
		if( this.props.mopidy.random ){
			button = <a className="active" onClick={() => this.props.mopidyActions.instruct('tracklist.setRandom', [false])}><FontAwesome name="random" /></a>
		}
		return button;
	}

	renderRepeatButton(){
		var button = <a onClick={() => this.props.mopidyActions.instruct('tracklist.setRepeat', [true])}><FontAwesome name="repeat" /></a>
		if( this.props.mopidy.repeat ){
			button = <a className="active" onClick={() => this.props.mopidyActions.instruct('tracklist.setRepeat', [false])}><FontAwesome name="repeat" /></a>
		}
		return button;
	}

	renderMiniPlayer(){
		var mopidy_track = false;
		if( typeof(this.props.mopidy.current_tltrack) !== 'undefined' && typeof(this.props.mopidy.current_tltrack.track) !== 'undefined' ) mopidy_track = this.props.mopidy.current_tltrack;

		return (
			<div className="player">

				<div className="current-track">
					<div className="title">{ mopidy_track ? mopidy_track.track.name : null }</div>
					{ mopidy_track ? <ArtistSentence artists={ mopidy_track.track.artists } /> : null }
				</div>

				<div className="controls">
					<a onClick={() => this.props.mopidyActions.previous()}>
						<FontAwesome name="step-backward" />
					</a>&nbsp;
					{ this.renderPlayButton() }
					<a onClick={() => this.props.mopidyActions.next()}>
						<FontAwesome name="step-forward" />
					</a>&nbsp;
					<ProgressSlider />
				</div>
			</div>
		);
	}

	renderFullPlayer(){
		var mopidy_track = false;
		if( typeof(this.props.mopidy.current_tltrack) !== 'undefined' && typeof(this.props.mopidy.current_tltrack.track) !== 'undefined' ) mopidy_track = this.props.mopidy.current_tltrack;

		return (
			<div className="player">

				{ this.props.spotify.track && !this.props.mini ? <Link className="artwork" to={'/album/'+this.props.spotify.track.album.uri}><Thumbnail size="huge" images={this.props.spotify.track.album.images} /></Link> : null }

				<div className="controls cf">
					<div className="pull-left">
						<a onClick={() => this.props.mopidyActions.previous()}>
							<FontAwesome name="step-backward" />
						</a>&nbsp;
						{ this.renderPlayButton() }
						<a onClick={() => this.props.mopidyActions.stop()}>
							<FontAwesome name="stop" />
						</a>&nbsp;
						<a onClick={() => this.props.mopidyActions.next()}>
							<FontAwesome name="step-forward" />
						</a>&nbsp;
					</div>
					<div className="pull-right">
						{ this.renderConsumeButton() }
						{ this.renderRandomButton() }
						{ this.renderRepeatButton() }
					</div>
				</div>

				<div className="current-track">
					<div className="title">{ mopidy_track ? mopidy_track.track.name : null }</div>
					{ mopidy_track ? <ArtistSentence artists={ mopidy_track.track.artists } /> : null }
				</div>
			</div>
		);
	}

	render(){
		if( this.props.mini ){
			return this.renderMiniPlayer()
		}else{
			return this.renderFullPlayer()
		}
	}
}


/**
 * Export our component
 *
 * We also integrate our global store, using connect()
 **/

const mapStateToProps = (state, ownProps) => {
	return state;
}

const mapDispatchToProps = (dispatch) => {
	return {
		mopidyActions: bindActionCreators(mopidyActions, dispatch)
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(Player)