/* global mOxie */
import Ember from "ember";

const get = Ember.get;
const reads = Ember.computed.reads;

const later = Ember.run.later;

const RSVP = Ember.RSVP;
const mOxieFileReader = mOxie.FileReader;

const settingsToConfig = function (settings = {}) {
  let url = settings.url;
  let method = settings.method || 'POST';
  let accepts = settings.accepts || ['application/json', 'text/javascript'];
  let contentType = settings.contentType || null;
  let headers = settings.headers || {};
  let data = settings.data || {};
  let maxRetries = settings.maxRetries || 0;
  let chunkSize = settings.chunkSize || 0;
  let multipart = settings.multipart;
  if (multipart !== true && multipart !== false) {
    multipart = true;
  }
  let fileKey = settings.fileKey || 'file';

  if (headers.Accept == null) {
    if (!Ember.Array.detect(accepts)) {
      accepts = Ember.A([accepts]).compact();
    }
    headers.Accept = accepts.join(',');
  }

  if (headers['Content-Type'] == null && contentType) {
    headers['Content-Type'] = contentType;
  }

  return {
    url: url,
    method: method,
    headers: headers,
    multipart: multipart,
    multipart_params: data,
    max_retries: maxRetries,
    chunk_size: chunkSize,
    file_data_name: fileKey
  };
};

/**
  A representation of a single file being uploaded
  by the `UploadQueue`.

  @namespace ember-plupload
  @class File
  @extends Ember.Object
 */
export default Ember.Object.extend({

  /**
    The unique ID of the file.

    @property id
    @type String
   */
  id: reads('file.id'),

  /**
    The name of the file.

    @property name
    @type String
   */
  name: reads('file.name'),

  /**
    The size of the file in bytes

    @property size
    @type Number
   */
  size: reads('file.size'),

  /**
    The content type of the file

    @property type
    @type String
   */
  type: reads('file.type'),

  /**
    The current upload progress of the file,
    which is a number between 0 and 100.

    @property progress
    @type Number
   */
  progress: Ember.computed(function () {
    return get(this, 'file.percent');
  }),

  /**
    Remove the file from the upload queue.

    @method destroy
   */
  destroy: function () {
    get(this, 'uploader').removeFile(get(this, 'file'));
  },

  upload: function (url, settings) {
    var uploader = get(this, 'uploader');
    this._deferred = RSVP.defer();

    if (settings == null) {
      settings = url;
    } else {
      settings.url = url;
    }
    this.settings = settingsToConfig.call(this, settings);

    // Start uploading the files
    later(uploader, 'start', 100);

    return this._deferred.promise;
  },

  read: function (options = { as: 'data-url' }) {
    let file = get(this, 'file').getSource();
    let reader = new mOxieFileReader();
    let { promise, resolve, reject } = RSVP.defer();
    reader.onloadend = resolve;
    reader.onerror = reject;

    switch (options.as) {
    case 'array-buffer':
      reader.readAsArrayBuffer(file);
      break;
    case 'data-url':
      reader.readAsDataURL(file);
      break;
    case 'binary-string':
      reader.readAsBinaryString(file);
      break;
    case 'text':
      reader.readAsText(file);
      break;
    }

    return promise.then(function () {
      return reader.result;
    }, function () {
      return reader.error;
    });
  }
});
