var camera,
  scene,
  renderer,
  octree,
  geometry,
  material,
  mesh,
  meshes = [],
  meshesSearch = [],
  meshCountMax = 1000,
  radius = 500,
  radiusMax = radius * 10,
  radiusMaxHalf = radiusMax * 0.5,
  radiusSearch = 400,
  searchMesh,
  base = new THREE.Color( 0x404040 ),
  found = new THREE.Color( 0xffffff ),
  adding = true,
  rayCaster = new THREE.Raycaster(),
  origin = new THREE.Vector3(),
  direction = new THREE.Vector3();

init();
animate();

function init() {

  // standard three scene, camera, renderer

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, radius * 100 );
  scene.add( camera );

  renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0x0d0d0d );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.getElementById("octree").appendChild( renderer.domElement );

  // create octree

  octree = new THREE.Octree( {
    // when undeferred = true, objects are inserted immediately
    // instead of being deferred until next octree.update() call
    // this may decrease performance as it forces a matrix update
    undeferred: false,
    // set the max depth of tree
    depthMax: Infinity,
    // max number of objects before nodes split or merge
    objectsThreshold: 8,
    // percent between 0 and 1 that nodes will overlap each other
    // helps insert objects that lie over more than one node
    overlapPct: 0.15,
    // pass the scene to visualize the octree
    scene: scene
  } );

  // create object to show search radius and add to scene

  searchMesh = new THREE.Mesh(
    new THREE.SphereGeometry( radiusSearch ),
    new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0.4 } )
  );
  scene.add( searchMesh );

}

function animate() {

  // note: three.js includes requestAnimationFrame shim
  requestAnimationFrame( animate );

  // modify octree structure by adding/removing objects

  modifyOctree();

  // search octree at random location

  searchOctree();

  // render results

  render();

  // update octree to add deferred objects

  octree.update();

}

var geometry = new THREE.BoxGeometry( 50, 50, 50 );

function modifyOctree() {

  // if is adding objects to octree

  if ( adding === true ) {

    // create new object

    mesh = new THREE.Line( geometry, new THREE.MeshBasicMaterial( { color: new THREE.Color( base ) } ) );

    // give new object a random position in radius

    mesh.position.set(
      Math.random() * radiusMax - radiusMaxHalf,
      Math.random() * radiusMax - radiusMaxHalf,
      Math.random() * radiusMax - radiusMaxHalf
    );

    // add new object to octree and scene

    octree.add( mesh );
    scene.add( mesh );

    // store object for later

    meshes.push( mesh );

    // if at max, stop adding

    if ( meshes.length === meshCountMax ) {

      adding = false;

    }

  }
  // else remove objects from octree
  else {

    // get object

    mesh = meshes.shift();

    // remove from scene and octree

    scene.remove( mesh );
    octree.remove( mesh );

    // if no more objects, start adding

    if ( meshes.length === 0 ) {

      adding = true;

    }

  }

  /*

  // octree details to console

  console.log( ' OCTREE: ', octree );
  console.log( ' ... depth ', octree.depth, ' vs depth end?', octree.depth_end() );
  console.log( ' ... num nodes: ', octree.node_count_end() );
  console.log( ' ... total objects: ', octree.object_count_end(), ' vs tree objects length: ', octree.objects.length );

  // print full octree structure to console

  octree.to_console();

  */

}

function searchOctree() {

  var i, il;

  // revert previous search objects to base color

  for ( i = 0, il = meshesSearch.length; i < il; i++ ) {

    meshesSearch[ i ].object.material.color.copy( base );

  }

  // new search position
  searchMesh.position.set(
    Math.random() * radiusMax - radiusMaxHalf,
    Math.random() * radiusMax - radiusMaxHalf,
    Math.random() * radiusMax - radiusMaxHalf
  );

  // record start time

  var timeStart = Date.now();

  // search octree from search mesh position with search radius
  // optional third parameter: boolean, if should sort results by object when using faces in octree
  // optional fourth parameter: vector3, direction of search when using ray (assumes radius is distance/far of ray)

  origin.copy( searchMesh.position );
  direction.set( Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1 ).normalize();
  rayCaster.set( origin, direction );
  meshesSearch = octree.search( rayCaster.ray.origin, radiusSearch, true, rayCaster.ray.direction );
  var intersections = rayCaster.intersectOctreeObjects( meshesSearch );

  // record end time

  var timeEnd = Date.now();

  // set color of all meshes found in search

  for ( i = 0, il = meshesSearch.length; i < il; i++ ) {

    meshesSearch[ i ].object.material.color.copy( found );

  }

  /*

  // results to console

  console.log( 'OCTREE: ', octree );
  console.log( '... searched ', meshes.length, ' and found ', meshesSearch.length, ' with intersections ', intersections.length, ' and took ', ( timeEnd - timeStart ), ' ms ' );

  */

}

function render() {

  var timer = - Date.now() / 5000;

  camera.position.x = Math.cos( timer ) * 10000;
  camera.position.z = Math.sin( timer ) * 10000;
  camera.lookAt( scene.position );

  renderer.render( scene, camera );

}
