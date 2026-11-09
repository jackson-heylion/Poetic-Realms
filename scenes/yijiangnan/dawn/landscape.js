/* 地形、远林和近岸石：采用连续高度网格与共享实例批次。 */
/** @typedef {object} PlantBatch
 * @property {THREE.InstancedMesh} mesh 共用几何和材质的植被绘制批次。
 * @property {number} total 完整画质下的实例总数，单位个。
 */
const instanceTransform = new THREE.Object3D();
const up = new THREE.Vector3(0,1,0);
const leafDirection = new THREE.Vector3();
const barkMaterial = new THREE.MeshStandardMaterial({ color: "#877659", roughness: .94 });

function leftBank(z) { return -1.8 + .15*z + 1.3*Math.sin(z*.07) + .13*Math.sin(z*1.4) + .04*Math.sin(z*7); }
function rightBank(z) { return 18 - .12*z + 2.2*Math.sin(z*.045); }
function bankHeight(distance,z) {
  return -.15 + .60*(1-Math.exp(-Math.max(0,distance)*.8)) + fbm(distance*1.5,z*.8)*.08;
}
function batch(geometry,material,total,vegetation=true) {
  const result = new THREE.InstancedMesh(geometry,material,total);
  result.frustumCulled = false;
  result.castShadow = true;
  result.receiveShadow = true;
  scene.add(result);
  if (vegetation) plantBatches.push({ mesh: result, total });
  return result;
}
function finishBatch(result) {
  result.instanceMatrix.needsUpdate = true;
  if (result.instanceColor) result.instanceColor.needsUpdate = true;
}
function placeInstance(result,index,x,y,z,sx,sy,sz,color,yaw=0) {
  instanceTransform.position.set(x,y,z);
  instanceTransform.rotation.set(0,yaw,0);
  instanceTransform.scale.set(sx,sy,sz);
  instanceTransform.updateMatrix();
  result.setMatrixAt(index,instanceTransform.matrix);
  if (color) result.setColorAt(index,color);
}

function buildLandscape() {
  const groundTexture = makeGroundTexture();
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff", map: groundTexture, vertexColors: true, roughness: .98,
  });
  for (const side of [-1,1]) {
    const vertices = [], colors = [], uv = [], indices = [];
    const nx = 60, nz = 130, width = side===-1 ? 36 : 65;
    for (let j=0;j<=nz;j++) {
      const z = 13-j*1.25, edge = side===-1 ? leftBank(z) : rightBank(z);
      for (let i=0;i<=nx;i++) {
        const distance = i/nx*width, x = edge+side*distance;
        const y = bankHeight(distance,z)+fbm(x*.2,z*.17)*Math.min(1,distance*.04);
        vertices.push(x,y,z);
        uv.push(i/nx,j/nz);
        const variation = fbm(x*.5,z*.5);
        const wet = Math.exp(-distance*1.8);
        const color = new THREE.Color().setHSL(.22+variation*.035,.30+variation*.12,.15+variation*.13);
        color.lerp(new THREE.Color("#655a37"),wet*.7);
        colors.push(color.r,color.g,color.b);
        if (i<nx && j<nz) {
          const a=j*(nx+1)+i, b=a+1, c=a+nx+1, d=c+1;
          if (side===-1) indices.push(a,c,b,b,c,d);
          else indices.push(a,b,c,b,d,c);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const bank = mesh(geometry,groundMaterial);
    bank.receiveShadow = true;
  }
  buildHills();
  buildForest();
  buildStones(groundTexture);
}

function makeGroundTexture() {
  const tile = document.createElement("canvas");
  tile.width = tile.height = 256;
  const ctx = tile.getContext("2d");
  const image = ctx.createImageData(256,256);
  for (let i=0;i<256*256;i++) {
    const value = Math.round(172+random(i+900)*70);
    image.data[i*4]=value; image.data[i*4+1]=value; image.data[i*4+2]=value-8; image.data[i*4+3]=255;
  }
  ctx.putImageData(image,0,0);
  const texture = new THREE.CanvasTexture(tile);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24,48);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4,renderer.capabilities.getMaxAnisotropy());
  return texture;
}

function buildHills() {
  for (let layer=0;layer<4;layer++) {
    const vertices = [], colors = [], uv = [], indices = [];
    const nx=130, nz=18, depth=-150-layer*128, amplitude=20+layer*11;
    for (let j=0;j<=nz;j++) {
      const v=j/nz, z=depth+(v-.5)*80;
      for (let i=0;i<=nx;i++) {
        const x=(i/nx-.5)*(620+layer*140);
        const peaks = Math.exp(-Math.pow((x+145+layer*40)/62,2))*.9+
          Math.exp(-Math.pow((x-190-layer*42)/75,2));
        const crest = Math.max(0,peaks-.04)*(0.83+fbm(x*.027+layer*7,z*.021)*.38);
        const y = -1+Math.pow(Math.sin(v*Math.PI),.75)*amplitude*crest;
        vertices.push(x,y,z);
        uv.push(i/nx*14,v*3);
        const color=new THREE.Color().setHSL(.27+layer*.035,.18+layer*.015,.19+layer*.045+fbm(x*.15,z*.15)*.08);
        colors.push(color.r,color.g,color.b);
        if (i<nx && j<nz) {
          const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
          indices.push(a,c,b,b,c,d);
        }
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    mesh(geometry,new THREE.MeshStandardMaterial({ vertexColors:true, roughness:1 }));
  }
}

function buildForest() {
  const foliage=foliageTextures();
  const crownMaterial=new THREE.MeshStandardMaterial({
    color:"#ffffff",map:foliage.color,normalMap:foliage.normal,
    normalScale:new THREE.Vector2(.65,.65),alphaTest:.42,
    alphaToCoverage:true,side:THREE.DoubleSide,roughness:.92,
  });
  const count=420;
  const trunks=batch(new THREE.CylinderGeometry(.085,.16,1,5),barkMaterial,count);
  const crowns=batch(new THREE.PlaneGeometry(2,2),crownMaterial,count*7);
  const color=new THREE.Color();
  for (let i=0;i<count;i++) {
    const side=i%4===0 ? -1 : 1;
    const z=(side===-1 ? -55 : -34)-random(i*11+100)*130;
    const distance=2+random(i*7+31)*37;
    const x=(side===-1 ? leftBank(z) : rightBank(z))+side*distance;
    const base=bankHeight(distance,z);
    const height=(side===-1 ? 2.6 : 3.4)+random(i*19+70)*4.3;
    placeInstance(trunks,i,x,base+height*.4,z,1,height*.8,1,null);
    for (let k=0;k<7;k++) {
      const radius=height*(.22+random(i*31+k)*.075);
      color.setHSL(.23+random(i*3+k)*.055,.24+random(i*13+k)*.20,.20+random(i*5+k)*.075);
      placeInstance(crowns,i*7+k,x+Math.sin(k*2.4+i)*radius*.6,
        base+height*(.61+random(i*23+k)*.18),z+Math.cos(k*2.4+i)*radius*.6,
        radius,radius*(.85+random(i+k)*.3),radius,color,i*.71+k*1.31);
    }
  }
  finishBatch(trunks); finishBatch(crowns);
}

/** @typedef {object} FoliageTextures
 * @property {THREE.CanvasTexture} color 冠层叶簇的颜色与透明轮廓。
 * @property {THREE.CanvasTexture} normal 冠层的切线空间法线纹理。
 */
// 透明叶簇贴在相互交错的三维冠层片上，保留真实孔隙与细碎的轮廓。
/** @returns {FoliageTextures} */
function foliageTextures() {
  const tile=document.createElement("canvas");
  tile.width=tile.height=512;
  const ctx=tile.getContext("2d");
  for (let i=0;i<1600;i++) {
    const angle=random(i*13+180)*Math.PI*2;
    const radius=Math.sqrt(random(i*11+14))*217;
    const irregular=1+Math.sin(angle*5+.7)*.12+Math.sin(angle*11)*.045;
    const x=256+Math.cos(angle)*radius*irregular,y=253+Math.sin(angle)*radius*irregular*.91;
    const length=4+random(i*7)*13,width=length*.30;
    const light=Math.round(150+random(i*19)*95);
    ctx.save(); ctx.translate(x,y); ctx.rotate(angle+random(i)*2);
    ctx.beginPath();
    ctx.moveTo(0,-length);
    ctx.quadraticCurveTo(width*1.6,-length*.2,0,length);
    ctx.quadraticCurveTo(-width*1.6,length*.1,0,-length);
    ctx.fillStyle="rgb("+light+","+(light+5)+","+(light-14)+")";
    ctx.fill(); ctx.restore();
  }
  const normalTile=document.createElement("canvas");
  normalTile.width=normalTile.height=512;
  const image=normalTile.getContext("2d").createImageData(512,512);
  for (let y=0;y<512;y++) for (let x=0;x<512;x++) {
    const i=(y*512+x)*4,nx=(x-256)/340,ny=(256-y)/340;
    const nz=Math.sqrt(Math.max(.08,1-nx*nx-ny*ny));
    image.data[i]=128+nx*100; image.data[i+1]=128+ny*100;
    image.data[i+2]=128+nz*126; image.data[i+3]=255;
  }
  normalTile.getContext("2d").putImageData(image,0,0);
  const color=new THREE.CanvasTexture(tile),normal=new THREE.CanvasTexture(normalTile);
  color.colorSpace=THREE.SRGBColorSpace;
  return {color,normal};
}

function buildStones(surfaceTexture) {
  const geometry=new THREE.SphereGeometry(1,18,12);
  const positions=geometry.attributes.position;
  for (let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    const n=.76+fbm(x*3+50,z*3+y)*.43;
    positions.setXYZ(i,x*n,y*n,z*n);
  }
  geometry.computeVertexNormals();
  const bump=surfaceTexture.clone();
  bump.repeat.set(2,2);
  bump.colorSpace=THREE.NoColorSpace;
  bump.needsUpdate=true;
  const material=new THREE.MeshStandardMaterial({
    color:"#ffffff",roughness:.74,bumpMap:bump,bumpScale:.024,
  });
  const stones=batch(geometry,material,150,false),color=new THREE.Color();
  for (let i=0;i<150;i++) {
    const z=5-random(i*17+720)*95,distance=random(i*23+9)*2.3;
    const x=leftBank(z)-distance;
    const radius=.12+random(i*27+64)*.48;
    color.setHSL(.12+random(i)*.07,.08+random(i+1)*.10,.20+random(i*5)*.16);
    placeInstance(stones,i,x,bankHeight(distance,z)+radius*.15,z,
      radius*1.4,radius*.7,radius,color,i*1.5);
  }
  finishBatch(stones);
}
