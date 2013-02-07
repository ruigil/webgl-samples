
// Detect if the browser support WebGL. If not just show a little message, and try to help the user.
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();


var scene, camera, renderer;
// this camera and scene are for creating a background.
var cameraCube, sceneCube;
var cubes = [];

var geometry, material;

var mouseX = 0, mouseY = 0;
var side;

init(); 
animate();

function init() {

   // we create a perspective camera to our world
   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );
   camera.position.z = -5000;

   // we create a perspective camera to the cube world
   cameraCube = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 100000 );

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

   // To construct a texture cube, we pass the urls, and say what kind of cube we want. Refaction is this case.
   var textureCube = THREE.ImageUtils.loadTextureCube( urls, new THREE.CubeRefractionMapping() );
   // this texture cube is goint to be used to create a material for the icecubes. 
   // An environment map, that the cubes are going to refract.
   var material = new THREE.MeshLambertMaterial( { color: 0xaaccff, envMap: textureCube, refractionRatio: 0.95 } );
   
   // for the icecubes gemotry, we are going to smooth out th edges.
   // We initialize a geometry modifier with the number of subdivisions that we want.
   var modifier = new THREE.SubdivisionModifier( 2 );
   // creating a cube geometry with 2 subdivisions.
   geometry = new THREE.CubeGeometry( 200, 200, 200, 2, 2, 2);
   // mergeVertices(); is run in case of duplicated vertices
   geometry.mergeVertices();
   geometry.computeCentroids();
   geometry.computeFaceNormals();
   geometry.computeVertexNormals();
   // we use it to modify the geometry of the cube and smooth out the edges.
   // to see it visually go to :
   // http://mrdoob.github.com/three.js/examples/webgl_geometry_subdivision.html
   modifier.modify( geometry );   
   
   for (var i = 40; i >= 0; i--) {
      // now we can create the mesh for our icecubes.
      var iceMesh = new THREE.Mesh( geometry, material );
      // we randomize the initial position, rotation and scale
      iceMesh.position.x = Math.random() * 5000 - 2500;
      iceMesh.position.y = Math.random() * 5000 - 2500;
      iceMesh.position.z = Math.random() * 5000 - 2500;
      iceMesh.scale.x = iceMesh.scale.y = iceMesh.scale.z = Math.random() * 2 + 1;
      iceMesh.rotation.z = iceMesh.rotation.y = iceMesh.rotation.x = Math.random() * 2*3.14;
      // we add each mesh to the scene
      scene.add( iceMesh );
      // and save it in the array to update them later.
      cubes.push( iceMesh );
   };
   
   // this point light is to mimic the sun.
   var pointLight = new THREE.PointLight( 0xffffff, 2, 0 );
   // we cheat and locate this light more or less where 
   // we have the sun in the image to make it more realistic.
   pointLight.position.set(0,10000,10000);
   var ambientLight = new THREE.AmbientLight( 0xffffff ); 
   // we add both lights to the scene
   scene.add( pointLight );
   scene.add( ambientLight );

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

   // the cube with this shader material
   var mesh = new THREE.Mesh( new THREE.CubeGeometry( 100, 100, 100 ), material );
   sceneCube.add( mesh );

   // we set up a WebGL renderer
   renderer = new THREE.WebGLRenderer(); 
   renderer.setSize( window.innerWidth, window.innerHeight );
   renderer.autoClear = false;

   // this is for looking the icecubes from both sides.
   side = camera.position.z;

   // and dynamically attach this to the page body.
   document.body.appendChild( renderer.domElement );

   // we add several listeners for the mouse move and click
   document.addEventListener('mousemove', onDocumentMouseMove, false);
   document.addEventListener('mousedown', onDocumentMouseDown, false);
}

function onDocumentMouseMove(event) {
   mouseX = ( event.clientX - ( window.innerWidth/2 ) ) * 4;
   mouseY = ( event.clientY - ( window.innerHeight/2 ) ) * 4;
}

function onDocumentMouseDown(event) {
   side = -side;
}

function animate() {
   requestAnimationFrame( animate );

   // we change the camera position based on the mouse move or click
   camera.position.x += ( mouseX - camera.position.x ) * .05;
   camera.position.y += ( - mouseY - camera.position.y ) * .05;
   camera.position.z += ( side - camera.position.z ) * .01;
   // but we make the camera alwat look at the origin of the scene
   camera.lookAt( scene.position );
   // we copy the camera rotation to the camera of the background
   // so they will keep in sync
   cameraCube.rotation.copy( camera.rotation );

   // we update the position and rotation of the icecubes
   var timer = 0.0001 * Date.now();
   for (var i = cubes.length - 1; i >= 0; i--) {
      var icecube = cubes[i];
      icecube.rotation.x += Math.random()*0.01;
      icecube.rotation.y += Math.random()*0.01;
      icecube.position.x = 2500 * Math.cos( timer + i * 3);
      icecube.position.z = 2500 * Math.cos( timer + i * 2);
   };

   // we must render the background first!
   renderer.render( sceneCube, cameraCube );
   // and then render the scene with the cubes.
   renderer.render( scene, camera );

}