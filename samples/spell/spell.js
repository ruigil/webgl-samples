/*
   author: @oceanos
*/

// Detect if the browser support WebGL. If not just show a little message, and try to help the user.
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var scene, camera, renderer;

var particles = [];
var particleCount = 7000;
var target;
var lookAt;

var mouseX = 0, mouseY = 0;
var composer;

init(); 
animate();

function init() {

   // we create a perspective camera to our world
   camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 5000 );
   camera.position.z = -1000;
   camera.position.y = -1000;

   // create a scene with some fog
   scene = new THREE.Scene();
   scene.fog = new THREE.Fog( 0x000033, 1, 800 );

   // a plane geometry for the ground
   var groundMat = new THREE.MeshBasicMaterial( { color: 0x009999} );
   var groundGeo = new THREE.PlaneGeometry( 5000, 5000);
   groundGeo.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2) );

   var groundMesh = new THREE.Mesh( groundGeo, groundMat );
   scene.add( groundMesh );

   // we load a tree model
   var loader = new THREE.JSONLoader();
   var treeMat = new THREE.MeshLambertMaterial( { color: 0x994400 } );

   loader.load( "../../models/tree.js", function( treeGeo ) {

      var treeMesh = new THREE.Mesh( treeGeo, treeMat );
      treeMesh.position.set( 0, 0, 0 );

      treeMesh.scale.set( 400, 400, 400 );

      treeMesh.matrixAutoUpdate = false;
      treeMesh.updateMatrix();

      scene.add( treeMesh );

   });

   // create particles using a generic geometry
   var particlesGeo = new THREE.Geometry();

   for ( var i = 0; i < particleCount; i++ ) {
      var particle = new Particle();

      particle.location.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
      particle.location.multiplyScalar( 200 );
      particle.mass = (Math.random()*5)+10;
      particle.color.setHSV((particle.mass-10)/10.0,1,1);

      // update geometry and colors
      particlesGeo.vertices.push( particle.location );
      particlesGeo.colors.push( particle.color );

      particles.push(particle);
   }

   // create texture for particle material
   var textureCanvas = document.createElement( 'canvas' );
   textureCanvas.width = 16; 
   textureCanvas.height = 16;
   var tchWidth = textureCanvas.width / 2;
   var tchHeight = textureCanvas.height / 2;

   var context = textureCanvas.getContext( '2d' );

   context.beginPath();
   context.arc( 8, 8, 8, 0, Math.PI * 2, false) ;
   context.closePath();

   var gradient = context.createRadialGradient( tchWidth, tchHeight, 0, tchWidth, tchHeight, tchWidth );

   gradient.addColorStop( 0, 'rgba(255,255,2255,1)' );
   gradient.addColorStop( 0.3, 'rgba(128,128,128,0.5)' );
   gradient.addColorStop( 1, 'rgba(0,0,0,0.0)' );

   context.fillStyle = gradient;
   context.fill();

   var particleTexture = new THREE.Texture( textureCanvas, THREE.UVMapping, THREE.RepeatWrapping, THREE.RepeatWrapping );   
   particleTexture.needsUpdate = true;

   // create particle material
   var particlesMat = new THREE.ParticleBasicMaterial( 
         {size: 16, 
         sizeAttenuation: true,
         blending: THREE.AdditiveBlending,  
         map: particleTexture, 
         transparent: true, 
         vertexColors: true} );

   particlesMesh = new THREE.ParticleSystem( particlesGeo, particlesMat );
   particlesMesh.sortParticles = true;
   particlesMesh.dynamic = true;
   scene.add( particlesMesh );

   // initial target
   target = new THREE.Vector3();
   target.set(Math.random()*400-200,100+Math.random()*200,Math.random()*400-200);

   lookAt = new THREE.Vector3();
   lookAt.add(target);

   // point light 
   var pointLight = new THREE.PointLight( 0xffffff, 2, 0 );
   pointLight.position.set(0,3000,5000);
   scene.add(pointLight);

   // we set up a WebGL renderer
   renderer = new THREE.WebGLRenderer({ clearAlpha: 1 });
   renderer.setClearColor( scene.fog.color, 1 );
   renderer.setSize( window.innerWidth, window.innerHeight );

   // post processing pass
   composer = new THREE.EffectComposer( renderer );

   var renderPass = new THREE.RenderPass( scene, camera );

   var vignettePass = new THREE.ShaderPass( THREE.VignetteShader );
   vignettePass.uniforms[ "darkness" ].value = 1.5;

   composer.addPass( renderPass );
   composer.addPass( vignettePass );

   vignettePass.renderToScreen = true;

   // dynamically attach the renderer to the page body.
   document.body.appendChild( renderer.domElement );

   // some stats for fps
   stats = new Stats();
   document.getElementById("stats").appendChild( stats.domElement );

   // we add a listener for the mouse move 
   document.addEventListener('mousemove', onDocumentMouseMove, false);

}

function onDocumentMouseMove(event) {
   mouseX = ( event.clientX - ( window.innerWidth/2 ) );
   mouseY = ( event.clientY - ( window.innerHeight/2) );
}


function animate() {
   requestAnimationFrame( animate );
 
   // iterate over the particles, make them seek the target and update the position
   for(var i=0; i<particles.length; i++) {
      particles[i].seek(target);
      particles[i].update();
   }
   // we need to flag threejs that the positions were updated
   particlesMesh.geometry.verticesNeedUpdate = true;

   // change the target at random
   if (Math.random() > 0.99) {
      target.set(Math.random()*400-200,100+Math.random()*200,Math.random()*400-200);
   }

   // update fps
   stats.update();
   // we change the camera position based on the mouse move 
   camera.position.x += ( mouseY -100 - camera.position.x ) * .036;
   camera.position.z += ( - ( mouseX ) - camera.position.z ) * .036;
   camera.position.y = 100;

   // the camera try to look at the target
   lookAt.x += (target.x - lookAt.x) * .01;
   lookAt.y += (target.y - lookAt.y) * .01;

   camera.lookAt( lookAt );

   // we tell to render the result of the post processing
   composer.render();

}