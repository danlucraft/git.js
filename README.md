
git.js
======

[Daniel Lucraft](http://danlucraft.com) 
[@danlucraft](http://twitter.com/danlucraft)

A git implementation in pure JavaScript.

Has two clients:

 * a command-line node.js client, 
 * and an in-browser repo API for accessing git through the HTTP protocol

Status
------

The command-line version currently implements:

 * git.js log       (shows 10 commits)
 * git.js branch    (listing local branches)
 * git.js show SHA  (show object information)

The client side API implements:
 
 * creating an in-memory repo
 * fetching remote objects through the dumb or smart HTTP git protocols
 * browsing the object graph
 * creating HTML object diffs

Usage
-----

To demo the in-browser repo viewer, install thin and run:

    $ rake demo

Plans
-----

 * package for npm
 * writing to repos: committing, branching
 * improving the client side API

DONE:

 * making it easy to run the included demo repo-viewer webapp

License
-------

Released under the MIT License.  See the [LICENSE][license] file for further details.

[license]: https://github.com/danlucraft/git.js/blob/master/LICENSE.md