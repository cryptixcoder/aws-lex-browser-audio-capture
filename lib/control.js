(function () {
  'use strict';
  var rec = require('./recorder.js');
  var recorder, audioRecorder, checkAudioSupport, audioSupported, UNSUPPORTED = 'Audio is not supported.';

  /**
   * Represents an audio control that can start and stop recording,
   * export captured audio, play an audio buffer, and check if audio
   * is supported.
   */
  exports.audioControl = function (options) {
    options = options || {};
    checkAudioSupport = options.checkAudioSupport !== false;

    /**
     * This callback type is called `onSilenceCallback`.
     *
     * @callback onSilenceCallback
     */

    /**
     * Visualize callback: `visualizerCallback`.
     *
     * @callback visualizerCallback
     * @param {Uint8Array} dataArray
     * @param {number} bufferLength
     */

    /**
     * Clears the previous buffer and starts buffering audio.
     *
     * @param {?onSilenceCallback} onSilence - Called when silence is detected.
     * @param {?visualizerCallback} visualizer - Can be used to visualize the captured buffer.
     * @param {silenceDetectionConfig} - Specify custom silence detection values.
     * @throws {Error} If audio is not supported.
     */
    var startRecording = function (onSilence, visualizer, silenceDetectionConfig) {
      onSilence = onSilence || function () { /* no op */
        };
      visualizer = visualizer || function () { /* no op */
        };
      audioSupported = audioSupported !== false;
      if (!audioSupported) {
        throw new Error(UNSUPPORTED);
      }
      recorder = audioRecorder.createRecorder(silenceDetectionConfig);
      recorder.record(onSilence, visualizer);
    };

    /**
     * Stops buffering audio.
     *
     * @throws {Error} If audio is not supported.
     */
    var stopRecording = function () {
      audioSupported = audioSupported !== false;
      if (!audioSupported) {
        throw new Error(UNSUPPORTED);
      }
      recorder.stop();
    };

    /**
     * On export complete callback: `onExportComplete`.
     *
     * @callback onExportComplete
     * @param {Blob} blob The exported audio as a Blob.
     */

    /**
     * Exports the captured audio buffer.
     *
     * @param {onExportComplete} callback - Called when the export is complete.
     * @param {sampleRate} The sample rate to use in the export.
     * @throws {Error} If audio is not supported.
     */
    var exportWAV = function (callback, sampleRate) {
      audioSupported = audioSupported !== false;
      if (!audioSupported) {
        throw new Error(UNSUPPORTED);
      }
      if (!(callback && typeof callback === 'function')) {
        throw new Error('You must pass a callback function to export.');
      }
      sampleRate = (typeof sampleRate !== 'undefined') ? sampleRate : 16000;
      recorder.exportWAV(callback, sampleRate);
    };

    /**
     * On playback complete callback: `onPlaybackComplete`.
     *
     * @callback onPlaybackComplete
     */

    /**
     * Plays the audio buffer with an HTML5 audio tag.
     * @param {Uint8Array} buffer - The audio buffer to play.
     * @param {?onPlaybackComplete} callback - Called when audio playback is complete.
     */
    var play = function (buffer, callback) {
      if (typeof buffer === 'undefined') {
        return;
      }
      var myBlob = new Blob([buffer]);
      var audio = document.createElement('audio');
      var objectUrl = window.URL.createObjectURL(myBlob);
      audio.src = objectUrl;
      audio.addEventListener('ended', function () {
        audio.currentTime = 0;
        if (typeof callback === 'function') {
          callback();
        }
      });
      audio.play();
      recorder.clear();
    };

    /**
     * On audio supported callback: `onAudioSupported`.
     *
     * @callback onAudioSupported
     * @param {boolean}
     */

    /**
     * Checks that getUserMedia is supported and the user has given us access to the mic.
     * @param {onAudioSupported} callback - Called with the result.
     */
    var supportsAudio = function (callback) {
      callback = callback || function () { /* no op */
        };
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        audioRecorder = rec.audioRecorder();
        audioRecorder.requestDevice()
          .then(function (stream) {
            audioSupported = true;
            callback(audioSupported);
          })
          .catch(function (error) {
            audioSupported = false;
            callback(audioSupported);
          });
      } else {
        audioSupported = false;
        callback(audioSupported);
      }
    };

    if (checkAudioSupport) {
      supportsAudio();
    }

    return {
      startRecording: startRecording,
      stopRecording: stopRecording,
      exportWAV: exportWAV,
      play: play,
      supportsAudio: supportsAudio
    };
  };
})();