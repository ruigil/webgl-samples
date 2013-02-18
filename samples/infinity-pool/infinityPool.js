/*
   author: @oceanos
*/

// Detect if the browser support WebGL. If not just show a little message, and try to help the user.
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var scene, camera, renderer;
// this camera and scene are for creating a background.
var cameraCube, sceneCube;
var geometry, material;
// the mesh for the pool surface
var poolMesh;
// the water object with the wavefield algorithm
var water;
// the wave field is a grid with 100 segments
var segments = 100;

var mouseX = 0, mouseY = 0;
var side;
// this allows to project a vector into the world and pick objects.
var projector;


init(); 
animate();

function init() {

   // we create a perspective camera to our world
   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );
   camera.position.y = 1000;
   camera.position.z = -5000;

   // we create a perspective camera to the cube world
   cameraCube = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 20000 );

   // we create a projector for picking objects. 
   // This is going to be used to define the point of the waves
   projector = new THREE.Projector();
   // two scenes
   scene = new THREE.Scene();
   sceneCube = new THREE.Scene();

   // here we load the 6 textures that are the six faces of the cube map
   var path = "textures/";
   var format = '.jpg';
   var urls = [
      path + 'posx' + format, path + 'negx' + format,
      path + 'posy' + format, path + 'negy' + format,
      path + 'posz' + format, path + 'negz' + format
   ];

   // To construct a texture cube, we pass the urls, and say what kind of cube we want. 
   var textureCube = THREE.ImageUtils.loadTextureCube( urls);
   // this texture cube is goint to be used to create a material for the pool. 
   var material = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: textureCube });
   
   // this creates a wave grid that encodes the height of the waves
   // the height of waves are between -1 to 1.
   water = new WaveField({ gridx: segments ,gridy: segments });
   // create the plane for the pool surface. 
   // the number of segments is the number of grid segments of the wave field
   geometry = new THREE.PlaneGeometry( 5000, 5000, segments-1, segments-1);
   geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2) );
   geometry.dynamic = true;
   poolMesh = new THREE.Mesh( geometry, material );
   scene.add( poolMesh );

   // texture for the building walls
   var texture = THREE.ImageUtils.loadTexture( "textures/highrise.jpg" );
   var wmaterial = new THREE.MeshBasicMaterial( { color: 0x999999, map: texture } );   

   // north
   makeWall(0,2500,0,wmaterial);
   // south
   makeWall(0,-2500,Math.PI,wmaterial);
   // east
   makeWall(2500,0,Math.PI/2,wmaterial);
   // west
   makeWall(-2500,0,-Math.PI/2,wmaterial);

   // ad an ambient light
   scene.add( new THREE.AmbientLight( 0xffffff ) );

   // Background shader
   // instead of making our own shader, we use the cube shader from threejs lib
   var shader = THREE.ShaderLib[ "cube" ];
   // we just configure the shader with our texture
   shader.uniforms[ "tCube" ].value = textureCube;

   // and create a material based on this shader.
   var material = new THREE.ShaderMaterial( {

      fragmentShader: shader.fragmentShader,
      vertexShader: shader.vertexShader,
      uniforms: shader.uniforms,
      depthWrite: false,
      side: THREE.BackSide

   });

   // the cube with this shader material for the background
   var mesh = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 100 ), material );
   sceneCube.add( mesh );

   // we set up a WebGL renderer
   renderer = new THREE.WebGLRenderer(); 
   renderer.setSize( window.innerWidth, window.innerHeight );
   renderer.autoClear = false;

   // this is for looking the pool from both sides.
   side = camera.position.z;

   // and dynamically attach this to the page body.
   document.body.appendChild( renderer.domElement );

   // some stats for fps
   stats = new Stats();
   document.getElementById("stats").appendChild( stats.domElement );

   // we add several listeners for the mouse move and click
   document.addEventListener('mousemove', onDocumentMouseMove, false);
   document.addEventListener('mousedown', onDocumentMouseDown, false);

}

function makeWall(offsetx,offsetz,rotation,wmaterial) {
   var pgeometry = new THREE.PlaneGeometry( 5000, 5000);
   pgeometry.applyMatrix( new THREE.Matrix4().makeRotationY( rotation ) ); 
   var wMesh = new THREE.Mesh( pgeometry, wmaterial );
   wMesh.position.x = offsetx;
   wMesh.position.z = offsetz;
   wMesh.position.y = -2500;
   scene.add( wMesh );
}

function onDocumentMouseMove(event) {
   mouseX = ( event.clientX - ( window.innerWidth/2 ) ) * 8;
   mouseY = ( event.clientY - ( window.innerHeight/2 ) ) * 8;
}

function onDocumentMouseDown(event) {
   event.preventDefault();
   side = -side;

   // so we pick the mouse coordinates and normalize them 
   // to a coordinate system from -1 to 1
   var xx = ( event.clientX / window.innerWidth ) * 2 - 1;
   var yy = - ( event.clientY / window.innerHeight ) * 2 + 1;

   // we create a vector with these coordinates
   var vector = new THREE.Vector3( xx, yy, 1 );
   // and build a ray caster with the vector.
   // the raycaster projects an imaginary line in the scene.
   // it multiplies the vector by an inverse transformation of the model view projection matrix
   var raycaster = projector.pickingRay( vector, camera );

   // and calculate intersections with objects in the scene
   var intersects = raycaster.intersectObjects( scene.children );

   var segmentSize = (5000/segments);

   // if we find an intersection
   if ( intersects.length > 0 ) {
      for( i = 0; i < intersects.length; i++ ) {
         intersector = intersects[ i ];
         // and it is the pool surface
         if ( intersector.object == poolMesh ) {
            // we use the intersection point to index the segment in the wave field
            var i = Math.floor(intersector.point.x/segmentSize) + (segments/2);
            var j = Math.floor(intersector.point.z/segmentSize) + (segments/2);
            // and add an oscillator there, with a short time to live.
            water.addOscillator({ox: i-1, oy: j-1, step: Math.PI/10, ttl: 6});
         }
      }
   }   
}

function animate() {
   requestAnimationFrame( animate );

   // update fps
   stats.update();
   // update wavefield
   water.update();

   // so we update the y component of the plane geometry
   // with the value of the wave field
   for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
      var idx = Math.floor(i%segments);
      var idy = Math.floor(i/segments);
      geometry.vertices[ i ].y = 500*water.get(idx,idy);
   }
   // we must recompute the normals for proper lighting
   geometry.computeFaceNormals();
   geometry.computeVertexNormals();
   // we must flag three.js for rendering the faces
   poolMesh.geometry.verticesNeedUpdate = true;
   poolMesh.geometry.normalsNeedUpdate = true;

   // we change the camera position based on the mouse move or click
   camera.position.x += ( mouseX - camera.position.x ) * .05;
   camera.position.z += ( side - camera.position.z ) * .01;
   // but we make the camera alwat look at the origin of the scene
   camera.lookAt( scene.position );
   // we copy the camera rotation to the camera of the background
   // so they will keep in sync
   cameraCube.rotation.copy( camera.rotation );

   // we must render the background first!
   renderer.render( sceneCube, cameraCube );
   // and then render the scene.
   renderer.render( scene, camera );

}