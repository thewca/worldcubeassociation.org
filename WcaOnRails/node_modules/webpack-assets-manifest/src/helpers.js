'use strict';

const os = require('os');
const path = require('path');
const crypto = require('crypto');
const util = require('util');
const chalk = require('chalk');
const lockfile = require('lockfile');

const lfLock = util.promisify(lockfile.lock);
const lfUnlock = util.promisify(lockfile.unlock);

/**
 * Display a warning message.
 *
 * @param {string} message
 */
function warn( message )
{
  const prefix = chalk.hex('#CC4A8B')('WARNING:');

  console.warn(chalk`${prefix} ${message}`);
}

warn.cache = new Set();

/**
 * Display a warning message once.
 *
 * @param {string} message
 */
warn.once = function( message ) {
  if ( warn.cache.has( message ) ) {
    return;
  }

  warn( message );

  warn.cache.add( message );
};

/**
 * @param  {*} data
 * @return {array}
 */
function maybeArrayWrap( data )
{
  return Array.isArray( data ) ? data : [ data ];
}

/**
 * Filter out invalid hash algorithms.
 *
 * @param  {array} hashes
 * @return {array} Valid hash algorithms
 */
function filterHashes( hashes )
{
  const validHashes = crypto.getHashes();

  return hashes.filter( hash => {
    if ( validHashes.includes(hash) ) {
      return true;
    }

    warn(chalk`{blueBright ${hash}} is not a supported hash algorithm`);

    return false;
  });
}

/**
 * See {@link https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity|Subresource Integrity} at MDN
 *
 * @param  {string[]} hashes - The algorithms you want to use when hashing `content`
 * @param  {string} content - File contents you want to hash
 * @return {string} SRI hash
 */
function getSRIHash( hashes, content )
{
  return Array.isArray( hashes ) ? hashes.map( hash => {
    const integrity = crypto.createHash(hash).update(content, 'utf8').digest('base64');

    return `${hash}-${integrity}`;
  }).join(' ') : '';
}

/**
 * Get the data type of an argument.
 *
 * @param  {*} input - Some variable
 * @return {string} Data type
 */
function varType( input )
{
  return Object.prototype.toString.call(input).slice(8, -1);
}

/**
 * Determine if the argument is an Object.
 *
 * @param {*} arg
 */
function isObject( arg )
{
  return varType( arg ) === 'Object';
}

/**
 * Get an object sorted by keys.
 *
 * @param  {object} object
 * @param  {(a: string, b: string) => number} compareFunction
 * @return {object}
 */
function getSortedObject(object, compareFunction)
{
  return Object.keys( object ).sort( compareFunction ).reduce(
    (sorted, key) => (sorted[ key ] = object[ key ], sorted),
    Object.create(null),
  );
}

/**
 * Find a Map entry key by the value
 *
 * @param {Map} map
 */
function findMapKeysByValue( map )
{
  const entries = [ ...map.entries() ];

  return searchValue => entries
    .filter( ([ , value ]) => value === searchValue )
    .map( ([ name ]) => name );
}

/**
 * Group items from an array based on a callback return value.
 *
 * @param {Array} arr
 * @param {(item: any) => string} getGroup
 * @param {(item: any, group: string) => any} mapper
 */
function group( arr, getGroup, mapper = item => item )
{
  return arr.reduce(
    (obj, item) => {
      const group = getGroup( item );

      if ( group ) {
        obj[ group ] = obj[ group ] || [];
        obj[ group ].push( mapper( item, group ) );
      }

      return obj;
    },
    Object.create(null),
  );
}

function md5( data )
{
  return crypto.createHash('md5').update( data ).digest('hex');
}

/**
 * Build a file path to a lock file in the tmp directory
 *
 * @param {string} filename
 */
function getLockFilename( filename )
{
  const name = path.basename( filename );
  const dirHash = md5( path.dirname( filename ) );

  return path.join( os.tmpdir(), `${dirHash}-${name}.lock` );
}

/**
 * Create a lockfile (async)
 *
 * @param {string} filename
 */
async function lock( filename )
{
  await lfLock(
    getLockFilename( filename ),
    {
      wait: 6000,
      retryWait: 100,
      stale: 5000,
      retries: 100,
    },
  );
}

/**
 * Remove a lockfile (async)
 *
 * @param {string} filename
 */
async function unlock( filename )
{
  await lfUnlock( getLockFilename( filename ) );
}

module.exports = {
  maybeArrayWrap,
  filterHashes,
  getSRIHash,
  warn,
  varType,
  isObject,
  getSortedObject,
  findMapKeysByValue,
  group,
  getLockFilename,
  lock,
  unlock,
};
