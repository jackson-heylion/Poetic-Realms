/* 红色春花与垂柳均为三维几何；纹理在本地 Canvas 生成，风动在 GPU 完成。 */
function windMaterial(material,translucent=false) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBreeze = windTime;
    shader.uniforms.uSunlight = { value: sunDirection };
    shader.vertexShader = "uniform highp float uBreeze;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
vec4 mvPosition = vec4(transformed,1.0);
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
float flexibility = pow(clamp(mvPosition.y,0.0,2.0),1.6);
mvPosition.x += sin(uBreeze*1.1+mvPosition.z*0.37+mvPosition.x*0.5)*0.024*flexibility;
mvPosition.z += cos(uBreeze*0.85+mvPosition.x*0.5)*0.011*flexibility;
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`);
    if (translucent) {
      shader.fragmentShader = "uniform highp vec3 uSunlight;\n" + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_fragment_end>", `
#include <lights_fragment_end>
vec3 sunInView = normalize((viewMatrix*vec4(uSunlight,0.0)).xyz);
float transmission = pow(max(dot(-normal,sunInView),0.0),2.0)*0.28;
reflectedLight.indirectDiffuse += diffuseColor.rgb*transmission;
`);
    }
  };
  material.customProgramCacheKey = () => translucent ? "dawn-translucent-v1" : "dawn-wind-v1";
  return material;
}

function leafGeometry() {
  const vertices=[],uv=[],indices=[];
  const nx=2,ny=8;
  for (let j=0;j<=ny;j++) {
    const t=j/ny,width=Math.pow(Math.sin(t*Math.PI),.85)*.5;
    for (let i=0;i<=nx;i++) {
      const side=(i/nx-.5)*2;
      vertices.push(side*width,t,Math.sin(t*Math.PI)*.10+side*side*.03);
      uv.push(i/nx,t);
      if (i<nx && j<ny) {
        const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
        indices.push(a,b,c,b,d,c);
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function flowerGeometry() {
  const vertices=[],uv=[],indices=[];
  const nx=8,ny=10;
  for (let petal=0;petal<5;petal++) {
    const start=vertices.length/3,angle=petal*Math.PI*.4;
    for (let j=0;j<=ny;j++) {
      const t=j/ny,radial=.015+t*.225;
      for (let i=0;i<=nx;i++) {
        const side=(i/nx-.5)*2;
        const width=Math.pow(Math.sin(t*Math.PI),.62)*.127;
        const x=radial*Math.cos(angle)-side*width*Math.sin(angle);
        const z=radial*Math.sin(angle)+side*width*Math.cos(angle);
        const y=.025+t*t*.045+Math.cos(side*Math.PI)*Math.sin(t*Math.PI)*.025;
        vertices.push(x,y,z);
        uv.push(i/nx,t);
        if (i<nx && j<ny) {
          const a=start+j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
          indices.push(a,c,b,b,c,d);
        }
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function petalTexture() {
  const tile=document.createElement("canvas");
  tile.width=128; tile.height=128;
  const ctx=tile.getContext("2d"),gradient=ctx.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,"#ffb8c0");
  gradient.addColorStop(.22,"#ffe0e3");
  gradient.addColorStop(1,"#fff5ee");
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,128,128);
  for (let i=0;i<28;i++) {
    ctx.beginPath();
    ctx.moveTo(64,0);
    ctx.bezierCurveTo(64+(i-14)*1.2,38,i*4.6,85,i*4.6,128);
    ctx.strokeStyle=i%3===0 ? "#eebfb84d" : "#f3d5cb55";
    ctx.lineWidth=.6;
    ctx.stroke();
  }
  const texture=new THREE.CanvasTexture(tile);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function orientedInstance(result,index,x,y,z,sx,sy,sz,dx,dy,dz,color) {
  leafDirection.set(dx,dy,dz).normalize();
  instanceTransform.position.set(x,y,z);
  instanceTransform.quaternion.setFromUnitVectors(up,leafDirection);
  instanceTransform.scale.set(sx,sy,sz);
  instanceTransform.updateMatrix();
  result.setMatrixAt(index,instanceTransform.matrix);
  if (color) result.setColorAt(index,color);
}

function buildPlants() {
  const leafShape=leafGeometry();
  const leafMaterial=windMaterial(new THREE.MeshStandardMaterial({
    color:"#ffffff",roughness:.78,side:THREE.DoubleSide,
  }),true);
  const flowerMaterial=windMaterial(new THREE.MeshStandardMaterial({
    color:"#ffffff",map:petalTexture(),roughness:.74,side:THREE.DoubleSide,
    emissive:"#350701",emissiveIntensity:.13,
  }),true);
  const count=720;
  const flowers=batch(flowerGeometry(),flowerMaterial,count);
  const centers=batch(new THREE.SphereGeometry(.034,7,5),
    windMaterial(new THREE.MeshStandardMaterial({color:"#e4b357",roughness:.8})),count);
  const stems=batch(new THREE.CylinderGeometry(.006,.009,1,4),
    windMaterial(new THREE.MeshStandardMaterial({color:"#415b29",roughness:.95})),count);
  const leaves=batch(leafShape,leafMaterial,count*5);
  const color=new THREE.Color();
  for (let i=0;i<count;i++) {
    const cluster=Math.floor(i/9),member=i%9;
    const z=4-Math.pow(random(cluster*13+79),1.65)*53+(random(member*17+cluster)-.5)*1.3;
    const distance=.35+random(cluster*31+103)*3.2+random(i*7)*.6;
    const x=leftBank(z)-distance;
    const base=bankHeight(distance,z),height=.38+random(i*11+11)*.52;
    const size=.39+random(i*19+129)*.43;
    const dx=(random(i*3)-.5)*.75,dy=.65+random(i*5)*.25,dz=.25+random(i*7)*.5;
    color.setHSL(.975+random(i*31)*.030,.85+random(i)*.12,.36+random(i*5)*.08);
    orientedInstance(flowers,i,x,base+height,z,size,size,size,dx,dy,dz,color);
    leafDirection.set(dx,dy,dz).normalize().multiplyScalar(size*.045);
    placeInstance(centers,i,x+leafDirection.x,base+height+leafDirection.y,z+leafDirection.z,
      size,size*.65,size,null);
    placeInstance(stems,i,x,base+height*.5,z,1,height,1,null);
    for (let j=0;j<5;j++) {
      const angle=j*2.4+i*.8,level=.16+j*.135;
      color.setHSL(.22+random(i*31+j)*.09,.46,.14+random(i+j)*.09);
      orientedInstance(leaves,i*5+j,x,base+height*level,z,.21,.28,.17,
        Math.cos(angle),.42,Math.sin(angle),color);
    }
  }
  for (const item of [flowers,centers,stems,leaves]) finishBatch(item);
  const grass=batch(leafShape,leafMaterial,4200);
  for (let i=0;i<4200;i++) {
    const z=7-random(i*9+281)*75,distance=.25+random(i*7+75)*6;
    const x=leftBank(z)-distance;
    const height=.15+random(i*17)*.42;
    color.setHSL(.20+random(i*21)*.10,.37,.14+random(i*3)*.12);
    orientedInstance(grass,i,x,bankHeight(distance,z),z,.025,height,.05,
      (random(i)-.5)*.4,1,(random(i+5)-.5)*.4,color);
  }
  finishBatch(grass);
  buildWillow(leafShape,leafMaterial);
}

function mergeGeometry(parts) {
  const vertices=[],normals=[],uv=[];
  for (const part of parts) {
    const geometry=part.index ? part.toNonIndexed() : part;
    vertices.push(...geometry.attributes.position.array);
    normals.push(...geometry.attributes.normal.array);
    if (geometry.attributes.uv) uv.push(...geometry.attributes.uv.array);
    if (geometry!==part) geometry.dispose();
    part.dispose();
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
  if (uv.length) geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  return geometry;
}

function buildWillow(leafShape,leafMaterial) {
  const root=new THREE.Vector3(18,.6,-18),parts=[];
  const trunk=new THREE.CatmullRomCurve3([
    root,new THREE.Vector3(17.5,3,-18),new THREE.Vector3(15.9,7.8,-18.5),
    new THREE.Vector3(16.1,11.5,-18.9),
  ]);
  parts.push(new THREE.TubeGeometry(trunk,24,.32,12,false));
  const branches=[];
  for (let i=0;i<11;i++) {
    const angle=i*2.4,radius=4+random(i*7+38)*4.4;
    const start=trunk.getPoint(.45+random(i*17)*.4);
    const tip=new THREE.Vector3(16+Math.cos(angle)*radius,7.5+random(i*11)*3,-18+Math.sin(angle)*radius*.7);
    const mid=start.clone().lerp(tip,.6);
    mid.y+=2.1;
    const branch=new THREE.CatmullRomCurve3([start,mid,tip]);
    branches.push(branch);
    parts.push(new THREE.TubeGeometry(branch,12,.085+random(i)*.05,5,false));
  }
  const strandCount=340,perStrand=20;
  const foliage=batch(leafShape,leafMaterial,strandCount*perStrand);
  const color=new THREE.Color();
  for (let i=0;i<strandCount;i++) {
    const branch=branches[i%branches.length];
    const start=branch.getPoint(.23+random(i*13+100)*.77);
    start.x+=(random(i*5)-.5)*1.8;
    start.z+=(random(i*9)-.5)*1.5;
    const length=1.7+random(i*11+64)*4.8;
    const tip=start.clone().add(new THREE.Vector3(.25+random(i)*.5,-length,(random(i+5)-.5)*.7));
    const mid=start.clone().lerp(tip,.5).add(new THREE.Vector3(.3,0,.15));
    const strand=new THREE.CatmullRomCurve3([start,mid,tip]);
    parts.push(new THREE.TubeGeometry(strand,7,.009,3,false));
    for (let j=0;j<perStrand;j++) {
      const point=strand.getPoint((j+.4)/perStrand),side=j%2===0 ? 1 : -1;
      color.setHSL(.23+random(i*31+j)*.035,.42,.21+random(i*7+j)*.10);
      orientedInstance(foliage,i*perStrand+j,point.x,point.y,point.z,
        .064,.28+random(i+j)*.12,.07,side*.35,-1,.16,color);
    }
  }
  const branchesMesh=mesh(mergeGeometry(parts),barkMaterial);
  branchesMesh.castShadow=true;
  branchesMesh.receiveShadow=true;
  finishBatch(foliage);
}
