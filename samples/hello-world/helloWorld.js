// so we have here variables for the scene, camera and renderer
var scene, camera, renderer; 
// here the vars for our mesh of points, the geometry and the material
var mesh, geometry, material;

// we call the functions to initialize our world and animate it
init(); 
animate();

function init() {

   // we construct a new perspective camera
   camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 10000 );
   camera.position.z = 1000;

   // and a scene
   scene = new THREE.Scene();

   // we are going to use a cube geometry to define the points that will compose the cube
   geometry = new THREE.CubeGeometry( 200, 200, 200 ); 

   // and for the material a basic red in hexadecimal code, with a wireframe option set with true
   material = new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true } );

   // we add the geometry and material to define and create a mesh of points.
   mesh = new THREE.Mesh( geometry, material ); 

   // and add that mesh to the scene
   scene.add( mesh );

   // we set up a WebGL renderer
   renderer = new THREE.WebGLRenderer(); 
   renderer.setSize( window.innerWidth, window.innerHeight );

   // and dynamically attach this to the page body.
   document.body.appendChild( renderer.domElement );
}

function animate() {
   // this function request a new animation frame, with our function 'animate'. 
   // This means it will call itself over and over again
   requestAnimationFrame( animate );

   // we rotate the mesh of points
   mesh.rotation.x += 0.01; 
   mesh.rotation.y += 0.02;

   // and ask the renderer to render the scene with the point of view defined by the camera.
   renderer.render( scene, camera );
}