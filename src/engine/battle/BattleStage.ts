import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { canvasTexture, groundTexture, random } from '../art';
import type { BattleEvent, WeaponType } from '../../game/types';
import type { CharacterContext } from '../characters/CharacterAnimator';
import { buildHouse } from '../environment/architecture';
import { buildCropField,buildOliveTree } from '../environment/vegetation';
import { buildTent } from '../environment/tents';
import { createCalmGroundTexture } from '../environment/materials';
import type { EnvironmentContext,EnvironmentWind } from '../environment/context';
import type { AuthoredMaterialId } from '../../content/materialsV2';

export interface StageUnit {
  id:string;name:string;side:'ally'|'enemy';hp:number;maxHp:number;
  archetype?:'raider'|'spearman'|'archer'|'captain';weaponType?:WeaponType;
  shield?:number;maxShield?:number;brokenUntilRound?:number|null;bp?:number;guarding?:boolean;
}
export interface StageState {units:StageUnit[];round?:number;status?:string;turnOrder?:string[];turnIndex?:number;}
export interface BattleLayoutUnit {id:string;x:number;y:number;headY:number;footY:number;side:'ally'|'enemy';visible:boolean;}
export interface BattleLayout {units:BattleLayoutUnit[];animating:boolean;activeActorId:string|null;}
interface StageOptions {
  scene:THREE.Scene;camera:THREE.OrthographicCamera;region:string;software:boolean;quality:'high'|'low';
  textures:{stone:THREE.Texture|null;adobe:THREE.Texture|null;wood:THREE.Texture|null;leaves:THREE.Texture|null;rock:THREE.Texture|null;roof?:THREE.Texture|null;sprig?:THREE.Texture;shadow?:THREE.Texture|null;surfaces?:Partial<Record<AuthoredMaterialId,THREE.Texture>>;glow:THREE.Texture;haze:THREE.Texture};
  frames:(kind:string)=>THREE.Texture[][]|undefined;
  heroActions?:(context:CharacterContext)=>THREE.Texture[];
  onLayout?:(layout:BattleLayout)=>void;
}
type LitMaterial=THREE.MeshStandardMaterial|THREE.MeshLambertMaterial;
interface Combatant {unit:StageUnit;group:THREE.Group;body:THREE.Mesh<THREE.PlaneGeometry,LitMaterial>;home:THREE.Vector3;height:number;width:number;weapon:THREE.Group;shield:THREE.Group;broken:boolean;guarding:boolean;hp:number;phase:number;}
interface Effect {object:THREE.Object3D;age:number;duration:number;update:(progress:number,dt:number)=>void;dispose?:()=>void;}
interface EventAnimation {event:BattleEvent;age:number;duration:number;impact:number;impacted:boolean;update:(t:number)=>void;hit:()=>void;finish:()=>void;resolve:()=>void;}

/** A real 3D battle stage. The event queue controls motion; React receives impacts in order. */
export class BattleStage {
  readonly root=new THREE.Group();
  private readonly environment=new THREE.Group();
  private readonly actors=new THREE.Group();
  private readonly effectsRoot=new THREE.Group();
  private readonly units=new Map<string,Combatant>();
  private readonly materials=new Map<string,LitMaterial>();
  private readonly ownedTextures=new Set<THREE.Texture>();
  private readonly effects:Effect[]=[];
  private state:StageState;
  private current:EventAnimation|null=null;
  private sequence=Promise.resolve();
  private disposed=false;
  private time=0;
  private layoutTime=0;
  private introduction=0;
  private cameraShake=0;
  private readonly target=new THREE.Vector3(0,.5,-.8);
  private readonly cameraBase=new THREE.Vector3(.8,7.2,20.5);
  private readonly reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  private activeActorId:string|null=null;
  private eventsPlayed=0;
  private round=1;
  private resultContext:'victory'|'exhausted'|null=null;
  private readonly flames:{mesh:THREE.Mesh;light?:THREE.PointLight;phase:number}[]=[];
  private readonly wind:THREE.Group[]=[];
  private readonly authoredWind:EnvironmentWind[]=[];
  private authoredEnvironment?:EnvironmentContext;
  private materialAtlasSource?:THREE.Texture;
  private materialAtlasSignature='';
  private environmentRefreshes=0;

  constructor(private readonly options:StageOptions,state:StageState) {
    this.state=state;this.round=state.round??1;this.root.name='Cinematic battle stage';this.root.add(this.environment,this.actors,this.effectsRoot);options.scene.add(this.root);
    this.buildEnvironment();this.batchEnvironment();
    if(options.software){const converted=new Map<THREE.MeshStandardMaterial,THREE.MeshLambertMaterial>();this.environment.traverse(object=>{if(!(object instanceof THREE.Mesh)||!(object.material instanceof THREE.MeshStandardMaterial))return;const original=object.material;let material=converted.get(original);if(!material){material=new THREE.MeshLambertMaterial({color:original.color,map:original.map,alphaTest:original.alphaTest,transparent:original.transparent,opacity:original.opacity,side:original.side,depthWrite:original.depthWrite,vertexColors:original.vertexColors});material.userData={...original.userData};converted.set(original,material);}object.material=material;});}
    this.refreshEnvironmentTextures(options.textures);
    this.setState(state);
  }

  /** Exploration and the Ofra battle backdrop share authored building and olive geometry. */
  private environmentContext():EnvironmentContext {
    if(this.authoredEnvironment)return this.authoredEnvironment;
    const t=this.options.textures,material=(color:THREE.ColorRepresentation,map:THREE.Texture|null=null,surface?:AuthoredMaterialId)=>{const key=`authored:${surface??''}:${new THREE.Color(color).getHexString()}:${map?.uuid??''}`;let value=this.materials.get(key) as THREE.MeshStandardMaterial|undefined;if(!value){value=new THREE.MeshStandardMaterial({color,map,roughness:1});if(surface)value.userData.surfaceId=surface;this.materials.set(key,value);}return value;};
    return this.authoredEnvironment={root:this.environment,materials:{stone:material('#eee7d9',t.stone,'limestone'),adobe:material('#f4eee2',t.adobe,'adobe'),wood:material('#ded5bd',t.wood,'wood'),roof:material('#eee2c6',t.roof??t.adobe,'sand'),rock:material('#d3cfb7',t.rock,'sand'),earth:material('#bba983'),leaf:material('#d0d6ae'),contact:material('#22281d'),color:color=>material(color)},obstacles:[],wind:this.authoredWind,interiors:[],groundHeight:()=>0,sprigTexture:t.sprig,surface:(id,color)=>material(color,t.surfaces?.[id]??null,id)};
  }

  private lit(color:THREE.ColorRepresentation,map:THREE.Texture|null=null,vertexColors=false,surface?:AuthoredMaterialId) {
    const key=`${surface??''}:${new THREE.Color(color).getHexString()}:${map?.uuid??''}:${vertexColors}`;let material=this.materials.get(key);
    if(!material){material=this.options.software?new THREE.MeshLambertMaterial({color,map,vertexColors}):new THREE.MeshStandardMaterial({color,map,vertexColors,roughness:.95});if(surface)material.userData.surfaceId=surface;this.materials.set(key,material);}return material;
  }

  /** Late offline/cache loads update live materials; actors, camera and event queue keep their identity. */
  refreshEnvironmentTextures(textures:StageOptions['textures']){
    if(this.disposed)return;Object.assign(this.options.textures,textures);
    const surfaces=textures.surfaces,dirt=surfaces?.dirt,signature=Object.entries(surfaces??{}).sort(([a],[b])=>a.localeCompare(b)).map(([id,texture])=>`${id}:${texture?.uuid}`).join('|');if(!dirt||this.materialAtlasSignature===signature)return;
    const ground=createCalmGroundTexture(dirt);ground.repeat.set(5.2,5.2);ground.name='Authored battle clay';this.ownedTextures.add(ground);
    const arena=(surfaces.sand??dirt).clone();arena.repeat.set(3,3);arena.needsUpdate=true;arena.name='Authored battle worn sand';this.ownedTextures.add(arena);
    const liveMaterials=new Set<THREE.Material>(this.materials.values());this.environment.traverse(object=>{if(object instanceof THREE.Mesh)(Array.isArray(object.material)?object.material:[object.material]).forEach(material=>liveMaterials.add(material));});
    const replaced=new Set<THREE.Texture>();
    for(const material of liveMaterials){
      if(!(material instanceof THREE.MeshStandardMaterial||material instanceof THREE.MeshLambertMaterial))continue;
      const role=material.userData.environmentGround as 'ground'|'arena'|undefined,surface=material.userData.surfaceId as AuthoredMaterialId|undefined,map=role==='ground'?ground:role==='arena'?arena:surface?surfaces[surface]:undefined;if(!map)continue;
      const previous=material.map;material.map=map;if(role){material.color.set(role==='ground'?'#efe9dc':'#e2dac8');if(previous&&this.ownedTextures.has(previous))replaced.add(previous);}
      if(material instanceof THREE.MeshStandardMaterial){material.bumpMap=map;material.bumpScale=surface==='limestone'?.045:surface==='adobe'?.018:.012;}material.needsUpdate=true;
    }
    replaced.forEach(texture=>{if(texture===ground||texture===arena)return;texture.dispose();this.ownedTextures.delete(texture);});
    this.materialAtlasSource=dirt;this.materialAtlasSignature=signature;this.environmentRefreshes++;
  }
  private box(x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material,parent:THREE.Object3D=this.environment) {const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  private cylinder(x:number,y:number,z:number,r:number,h:number,material:THREE.Material,parent:THREE.Object3D=this.environment) {const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,h,7),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}

  private buildEnvironment() {
    const {region,textures,scene}=this.options,night=region==='altar'||region==='midian',rnd=random(443);
    scene.background=new THREE.Color(night?'#121e30':region==='harode'?'#8fa3ad':'#afb3a3');scene.fog=new THREE.FogExp2(night?'#233147':region==='harode'?'#8d9ea3':'#adaf97',.019);
    this.environment.add(new THREE.HemisphereLight(night?'#9eb8dd':'#bfdae1',night?'#262a30':'#8a7754',night?.95:1.05));
    const sun=new THREE.DirectionalLight(night?'#a6b7e8':'#ffd199',night?1.5:3.2);sun.position.set(-9,13,11);sun.castShadow=!this.options.software;sun.shadow.mapSize.set(this.options.quality==='high'?2048:512,this.options.quality==='high'?2048:512);Object.assign(sun.shadow.camera,{left:-15,right:15,top:12,bottom:-12,near:.1,far:55});sun.shadow.bias=-.0006;sun.shadow.normalBias=.035;this.environment.add(sun,sun.target);
    const rim=new THREE.DirectionalLight(night?'#ffbe76':'#fff0c6',night?.7:.5);rim.position.set(8,5,-9);this.environment.add(rim);
    const faceFill=new THREE.DirectionalLight(night?'#d5dfe2':'#e6e2d4',night?1.05:.3);faceFill.position.set(1,8,17);this.environment.add(faceFill);
    const groundMap=groundTexture();groundMap.repeat.set(5.2,5.2);groundMap.needsUpdate=true;this.ownedTextures.add(groundMap);const ground=new THREE.Mesh(new THREE.PlaneGeometry(70,65),this.lit(night?'#a6a18b':region==='ofra'?'#efe9dc':'#d6c9a1',groundMap));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.position.y=-.025;this.environment.add(ground);
    ground.material.userData.environmentGround='ground';const stageGround=new THREE.Mesh(new THREE.CircleGeometry(9.5,48),this.lit('#ddd3bf',groundMap));stageGround.material.userData.environmentGround='arena';stageGround.rotation.x=-Math.PI/2;stageGround.scale.y=.58;stageGround.position.set(0,-.014,.1);stageGround.receiveShadow=true;this.environment.add(stageGround);
    // Distant ridges, middle ground terraces and foreground brush create separate depth layers.
    for(let i=0;i<19;i++){const height=3+rnd()*9,x=-32+i*3.5,z=-24-rnd()*15;const mountain=new THREE.Mesh(new THREE.ConeGeometry(6+rnd()*5,height,6),this.lit(night?['#26384b','#2c4051','#344758'][i%3]:['#777f77','#8c9181','#929887'][i%3]));mountain.position.set(x,height/2-1,z);mountain.rotation.y=rnd()*3;this.environment.add(mountain);}
    for(let i=0;i<35;i++){const x=(rnd()-.5)*44,z=-8-rnd()*10;if(Math.abs(x)<6&&z>-10)continue;this.rock(x,z,.45+rnd()*1.2,textures.rock);}
    const stone=this.lit('#eee7d9',textures.stone,false,'limestone'),wood=this.lit('#ded5bd',textures.wood,false,'wood');
    for(let i=0;i<24;i++)this.box(-16+i*1.35,.24,-9.5,.95,.45,.62,stone);
    if(region==='ofra'||region==='altar'){
      this.house(-10,-12,4.6,3.4,3.2);this.house(8,-14,4,3.5,3.9);this.house(-3,-18,3.8,3.2,2.7);
      for(const [x,z,scale] of [[-11,-5,1.3],[11,-7,1.2],[-6,-14,1.2],[4,-13,1],[15,-11,1.4]])this.tree(x,z,scale);
      if(region==='altar'){this.box(0,.3,-11,4,.6,2,stone);this.box(0,.9,-11,2.1,.7,1.3,stone);this.fire(-5,-7);this.fire(8,-8);}
      else {this.wheat(-11,-2,3,3);this.wheat(11,-1,3.6,2);this.wheat(-4,-10,4,2);}
    }else{
      for(const [x,z,s] of [[-10,-8,1.8],[-5,-12,1.4],[1,-13,1.5],[8,-10,1.7],[13,-14,1.5],[-15,-16,1.3]])this.tent(x,z,s,region==='midian');
      for(let i=0;i<(region==='midian'?44:20);i++){const x=-28+rnd()*56,z=-19-rnd()*18,s=.45+rnd()*.55;this.tent(x,z,s,true);if(i%3===0)this.distantFire(x+1,z);}
      this.fire(-8,-5);this.fire(8,-7);this.fire(2,-12);
      this.tree(13,-4,1.2);this.tree(-13,-3,1.25);
      if(region==='harode'){const water=new THREE.Mesh(new THREE.CircleGeometry(5,30),this.options.software?new THREE.MeshLambertMaterial({color:'#d9e0d9',map:textures.surfaces?.water??null,transparent:true,opacity:.8}):new THREE.MeshStandardMaterial({color:'#d9e0d9',map:textures.surfaces?.water??null,metalness:.3,roughness:.2,transparent:true,opacity:.9}));water.material.userData.surfaceId='water';water.rotation.x=-Math.PI/2;water.position.set(10,.012,-7);water.scale.y=.55;this.environment.add(water);}
    }
    // Low vegetation and limestone fragments continue beyond the tactical formation.
    const count=850,blades:number[]=[];for(let i=0;i<3;i++){const a=i*Math.PI/3;blades.push(-Math.cos(a)*.07,0,-Math.sin(a)*.07,Math.cos(a)*.07,0,Math.sin(a)*.07,0,.33,0);}const grassGeo=new THREE.BufferGeometry();grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(blades,3));grassGeo.computeVertexNormals();const grassMat=this.lit('#7b8559');grassMat.side=THREE.DoubleSide;const grass=new THREE.InstancedMesh(grassGeo,grassMat,count),dummy=new THREE.Object3D();
    for(let i=0;i<count;i++){const x=(rnd()-.5)*34,z=(rnd()-.5)*26;dummy.position.set(x,0,z);dummy.scale.setScalar(Math.abs(x)<7&&Math.abs(z)<3?.03:.6+rnd()*.8);dummy.rotation.y=rnd()*Math.PI;dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}this.environment.add(grass);
    for(let i=0;i<22;i++)this.rock((rnd()-.5)*28,5+rnd()*4,.15+rnd()*.35,textures.rock);
    // Blurred foreground branches frame the scene without replacing the playable terrain.
    this.tree(-13,6,1.25);this.tree(13,6.5,1.3);
    for(let i=0;i<3;i++){const haze=new THREE.Sprite(new THREE.SpriteMaterial({map:textures.haze,color:night?'#8499b5':'#ffe0ac',transparent:true,opacity:night?.15:.22,depthWrite:false}));haze.position.set(-12+i*12,1.4,-7-i*5);haze.scale.set(27,6,1);this.environment.add(haze);}
    if(night){const stars=new Float32Array(140*3);for(let i=0;i<140;i++){stars[i*3]=(rnd()-.5)*95;stars[i*3+1]=10+rnd()*29;stars[i*3+2]=-32-rnd()*25;}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(stars,3));this.environment.add(new THREE.Points(g,new THREE.PointsMaterial({color:'#d6dedc',size:.08,transparent:true,opacity:.7,depthWrite:false})));}
    // Discarded jars and timber supply the same historical vocabulary as exploration.
    for(const [x,z] of [[-8,2],[8.6,1],[-9,-5],[10,-6]]){this.cylinder(x,.32,z,.28,.65,this.lit('#a77854'));this.box(x+.4,.08,z+.5,1,.12,.12,wood).rotation.y=.6;}
  }

  private rock(x:number,z:number,size:number,map:THREE.Texture|null) {const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(size,1),this.lit('#d5d0bd',map,false,'sand'));rock.position.set(x,size*.33,z);rock.scale.set(1,.62,.9);rock.rotation.y=x+z;rock.castShadow=true;rock.receiveShadow=true;this.environment.add(rock);}
  private house(x:number,z:number,w:number,d:number,h:number){buildHouse(this.environmentContext(),{x,z,width:w,depth:d,height:h});}
  private tree(x:number,z:number,scale:number){buildOliveTree(this.environmentContext(),x,z,scale);}
  private tent(x:number,z:number,scale:number,enemy=false){buildTent(this.environmentContext(),x,z,scale,enemy);}
  private wheat(x:number,z:number,w:number,d:number){buildCropField(this.environmentContext(),x,z,w,d);}

  private distantFire(x:number,z:number){const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.options.textures.glow,color:'#ffc17a',transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));sprite.position.set(x,.5,z);sprite.scale.setScalar(1.2);this.environment.add(sprite);}
  private fire(x:number,z:number){const flame=new THREE.Mesh(new THREE.ConeGeometry(.17,.65,5),new THREE.MeshBasicMaterial({color:'#ffcd7c'}));flame.position.set(x,.45,z);this.environment.add(flame);this.distantFire(x,z);let light:THREE.PointLight|undefined;if(this.flames.length<2){light=new THREE.PointLight('#ffb66b',9,8,2);light.position.set(x,1.15,z);this.environment.add(light);}this.flames.push({mesh:flame,light,phase:x+z});}

  private batchEnvironment(){this.environment.updateMatrixWorld(true);const dynamic=new Set<THREE.Object3D>([...this.wind,...this.authoredWind.map(w=>w.object),...this.flames.map(f=>f.mesh)]),groups=new Map<string,{material:THREE.Material;meshes:THREE.Mesh[];cast:boolean;receive:boolean}>();this.environment.traverse(object=>{if(!(object instanceof THREE.Mesh)||object instanceof THREE.InstancedMesh||Array.isArray(object.material))return;let ancestor:THREE.Object3D|null=object;while(ancestor&&ancestor!==this.environment){if(dynamic.has(ancestor))return;ancestor=ancestor.parent;}const key=`${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;let entry=groups.get(key);if(!entry){entry={material:object.material,meshes:[],cast:object.castShadow,receive:object.receiveShadow};groups.set(key,entry);}entry.meshes.push(object);});for(const entry of groups.values()){if(entry.meshes.length<2)continue;const geometries=entry.meshes.map(mesh=>(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld)),g=mergeGeometries(geometries,false);geometries.forEach(geo=>geo.dispose());if(!g)continue;const mesh=new THREE.Mesh(g,entry.material);mesh.castShadow=entry.cast;mesh.receiveShadow=entry.receive;this.environment.add(mesh);entry.meshes.forEach(original=>{original.removeFromParent();original.geometry.dispose();});}}

  setState(state:StageState){this.state=state;this.round=state.round??this.round;let ally=0,enemy=0;for(const unit of state.units){let actor=this.units.get(unit.id);if(!actor){const index=unit.side==='ally'?ally++:enemy++;actor=this.createCombatant(unit,index);this.units.set(unit.id,actor);}else {if(unit.side==='ally')ally++;else enemy++;actor.unit={...unit};actor.hp=unit.hp;actor.broken=unit.brokenUntilRound!=null&&this.round<=unit.brokenUntilRound;actor.guarding=!!unit.guarding;if(!this.current){actor.group.visible=unit.hp>0;actor.body.material.opacity=1;}}}for(const [id,actor]of this.units)if(!state.units.some(unit=>unit.id===id))actor.group.visible=false;this.emitLayout();}

  private createCombatant(unit:StageUnit,index:number):Combatant{
    const enemy=unit.side==='enemy',captain=unit.archetype==='captain',height=enemy?(captain?3.15:unit.archetype==='spearman'?3.05:2.7):(unit.id==='gideon'||unit.id==='gideao'?2.75:2.55),width=height*.8;
    const positions=enemy?[[-5.1,-3.4],[-1.7,-2.6],[-8.7,-3.2],[-2.9,-5.5]]:[[4.2,2.5],[5.4,1],[3.1,-.5],[6.2,3.2]],p=positions[index%positions.length];
    const group=new THREE.Group();group.position.set(p[0],0,p[1]);this.actors.add(group);const frames=this.getFrames(unit),map=frames?.[0]?.[0]??null;
    const material:LitMaterial=this.options.software?new THREE.MeshLambertMaterial({map,color:enemy?'#fff3dc':'#fff7e8',transparent:true,alphaTest:.3,side:THREE.DoubleSide}):new THREE.MeshStandardMaterial({map,color:enemy?'#fff3dc':'#fff7e8',transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.95});
    const body=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material);body.position.y=height/2;body.castShadow=true;group.add(body);
    const shadow=new THREE.Mesh(this.options.textures.shadow?new THREE.PlaneGeometry(1.6,1.6):new THREE.CircleGeometry(.65,24),new THREE.MeshBasicMaterial({map:this.options.textures.shadow??null,color:'#1b201e',transparent:true,opacity:.35,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.5;shadow.position.y=.015;group.add(shadow);
    const weapon=this.createWeapon(unit.weaponType??(unit.archetype==='spearman'?'spear':unit.archetype==='archer'?'bow':'sword'));weapon.position.set(enemy?.35:-.35,height*.47,.13);group.add(weapon);weapon.visible=false;
    const shield=new THREE.Group();shield.position.set(enemy?.4:-.4,height*.43,.19);const face=new THREE.Mesh(new THREE.CircleGeometry(.36,10),this.lit('#7c7766'));const rim=new THREE.Mesh(new THREE.RingGeometry(.32,.37,10),this.lit('#d1bb84'));rim.position.z=.01;shield.add(face,rim);shield.visible=false;group.add(shield);
    return {unit:{...unit},group,body,home:group.position.clone(),height,width,weapon,shield,broken:unit.brokenUntilRound!=null&&this.round<=unit.brokenUntilRound,guarding:!!unit.guarding,hp:unit.hp,phase:index*1.3+(enemy?2:0)};
  }

  private getFrames(unit:StageUnit){return this.options.frames(unit.side==='enemy'?`enemy-${unit.archetype??'raider'}`:unit.id==='gideon'||unit.id==='gideao'?'gideao':unit.id==='pura'?'pura':'villager')??this.options.frames(unit.side==='enemy'?'guard':'pura');}
  private createWeapon(kind:WeaponType){const group=new THREE.Group(),metal=this.lit('#c1c3b9'),wood=this.lit('#b7a38b',this.options.textures.wood,false,'wood');group.userData.weaponType=kind;if(kind==='sword'){this.box(0,.42,0,.075,.85,.035,metal,group);this.box(0,-.05,0,.28,.045,.06,this.lit('#d1ad63'),group);this.box(0,-.18,0,.06,.25,.06,wood,group);}else if(kind==='spear'){this.cylinder(0,.15,0,.025,1.65,wood,group);const point=new THREE.Mesh(new THREE.ConeGeometry(.075,.32,4),metal);point.position.y=1.12;group.add(point);}else if(kind==='bow'){const bow=new THREE.Mesh(new THREE.TorusGeometry(.48,.035,4,18,Math.PI),wood);bow.rotation.z=-Math.PI/2;group.add(bow);this.box(.0,0,0,.012,.95,.012,this.lit('#d0bc89'),group);}else this.cylinder(0,.25,0,.045,1.65,wood,group);return group;}

  resize(width:number,height:number){const aspect=width/height,halfHeight=Math.max(5.25,9.9/aspect);const camera=this.options.camera;camera.left=-halfHeight*aspect;camera.right=halfHeight*aspect;camera.top=halfHeight;camera.bottom=-halfHeight;camera.zoom=1;camera.updateProjectionMatrix();this.updateCamera(0);this.emitLayout();}
  setQuality(quality:'high'|'low'){this.options.quality=quality;this.environment.traverse(child=>{if(child instanceof THREE.DirectionalLight&&child.castShadow){child.shadow.mapSize.set(quality==='high'?2048:512,quality==='high'?2048:512);child.shadow.map?.dispose();child.shadow.map=null;}});}

  animate(events:readonly BattleEvent[],speed=1,onEvent?:(event:BattleEvent)=>void):Promise<void>{
    const safeSpeed=THREE.MathUtils.clamp(speed,.5,3);const task=async()=>{for(const event of events){if(this.disposed)return;await this.animateEvent(event,safeSpeed,onEvent);}};
    this.sequence=this.sequence.then(task,task);return this.sequence;
  }

  private animateEvent(event:BattleEvent,speed:number,onEvent?: (event:BattleEvent)=>void):Promise<void>{
    if(this.disposed)return Promise.resolve();
    const actor=this.units.get(event.actorId),target=this.units.get(event.targetId??event.actorId)??actor,weapon=event.weapon??actor?.unit.weaponType??'sword';this.activeActorId=event.actorId;
    const duration=(event.kind==='hit'?(weapon==='bow'?.75:.65):event.kind==='break'?.75:event.kind==='result'?.85:.48)/speed;
    const from=actor?.group.position.clone(),targetFrom=target?.group.position.clone(),direction=actor?.unit.side==='ally'?-1:1;
    const approach=from&&targetFrom?targetFrom.clone().sub(from):new THREE.Vector3();approach.y=0;const contactGap=weapon==='spear'?1.8:1.2;approach.setLength(Math.max(0,approach.length()-contactGap));
    if(actor&&event.kind==='hit'){if(actor.weapon.userData.weaponType!==weapon){this.removeEffectObject(actor.weapon);actor.weapon=this.createWeapon(weapon);actor.weapon.position.set(direction*.35,actor.height*.47,.13);actor.group.add(actor.weapon);}actor.unit.weaponType=weapon;actor.weapon.visible=true;actor.weapon.rotation.z=weapon==='spear'?-direction*Math.PI/2:0;}
    return new Promise(resolve=>{
      let projectile:THREE.Object3D|undefined,projectileFrom:THREE.Vector3|undefined,projectileTo:THREE.Vector3|undefined;
      if(weapon==='bow'&&event.kind==='hit'&&actor&&target){projectile=this.arrow();projectileFrom=actor.group.position.clone().add(new THREE.Vector3(direction*.7,1.35,0));projectileTo=target.group.position.clone().add(new THREE.Vector3(0,1.3,0));projectile.position.copy(projectileFrom);projectile.visible=false;const aim=projectileTo.clone().sub(projectileFrom).normalize();projectile.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),aim);this.effectsRoot.add(projectile);}
      const impact=event.kind==='hit'?.56:.35;
      this.current={event,age:0,duration,impact,impacted:false,resolve,update:t=>{
        if(actor&&from){
          if(event.kind==='hit'){
            const rush=weapon==='bow'?0:Math.sin(Math.min(1,t/.56)*Math.PI/2)*(t<.56?1:Math.max(0,1-(t-.56)/.44));actor.group.position.copy(from).addScaledVector(approach,rush);actor.group.position.y+=Math.sin(t*Math.PI)*.12;
            actor.weapon.rotation.z=weapon==='spear'?-direction*Math.PI/2:weapon==='bow'?direction*.1:-direction*(1.5-t*3.2);actor.weapon.position.x=direction*(.3+(weapon==='spear'?Math.sin(t*Math.PI)*.7:0));
          }else if(event.kind==='guard'||event.kind==='recover'){actor.body.rotation.z=direction*Math.sin(t*Math.PI)*.045;actor.shield.visible=event.kind==='guard';}
          else if(event.kind==='boost'){actor.body.material.emissive.set('#8b602b');actor.body.material.emissiveIntensity=Math.sin(t*Math.PI)*.35;}
        }
        if(projectile&&projectileFrom&&projectileTo){projectile.visible=t>.2&&t<impact;projectile.position.copy(projectileFrom).lerp(projectileTo,THREE.MathUtils.clamp((t-.2)/(impact-.2),0,1));}
        if(target&&targetFrom&&event.kind==='hit'&&t>impact){const recoil=Math.sin((t-impact)/(1-impact)*Math.PI);target.group.position.copy(targetFrom).add(new THREE.Vector3(direction*.32*recoil,0,0));target.body.rotation.z=direction*recoil*.12;target.body.material.emissive.set('#9b3f2f');target.body.material.emissiveIntensity=recoil*.55;}
      },hit:()=>{
        this.applyImpact(event,actor,target,weapon);try{onEvent?.(event);}catch(error){console.warn('Battle impact callback failed',error);}this.eventsPlayed++;
      },finish:()=>{
        if(actor&&from){actor.group.position.copy(from);actor.weapon.visible=false;actor.weapon.rotation.set(0,0,0);actor.body.material.emissive.set('#000000');actor.body.material.emissiveIntensity=1;}
        if(target&&targetFrom){target.group.position.copy(targetFrom);target.body.material.emissive.set('#000000');target.body.material.emissiveIntensity=1;target.body.rotation.z=0;}
        if(projectile)this.removeEffectObject(projectile);this.activeActorId=null;this.emitLayout();
      }};
    });
  }

  private applyImpact(event:BattleEvent,actor:Combatant|undefined,target:Combatant|undefined,weapon:WeaponType){
    const receiver=target??actor;if(event.kind==='hit'&&receiver){receiver.hp=event.hpAfter??Math.max(0,receiver.hp-(event.amount??0));if(event.shieldAfter!==undefined)receiver.unit.shield=event.shieldAfter;this.floating(receiver,event.amount!==undefined?String(event.amount):'GOLPE',event.weakness?'#ffe2a0':'#fff4dd',1);if(event.weakness)this.floating(receiver,'VULNERÁVEL','#eac071',.62,.45);this.impactTrail(receiver,weapon,actor?.unit.side==='ally'?-1:1);this.particles(receiver.group.position.clone().add(new THREE.Vector3(0,1.25,0)),event.weakness?'#e1c079':'#d1b49a',event.weakness?14:8);if(!this.reducedMotion)this.cameraShake=.09;if(receiver.hp<=0)this.floating(receiver,'CAIU','#c9c0a6',.55,.5);}
    else if(event.kind==='break'&&receiver){receiver.broken=true;receiver.guarding=false;receiver.unit.shield=0;receiver.unit.brokenUntilRound=event.brokenUntilRound??this.round+1;this.floating(receiver,'QUEBRA DE POSTURA','#f0ce83',.94,.4);this.particles(receiver.group.position.clone().add(new THREE.Vector3(0,1.45,0)),'#d3bb80',24,true);if(!this.reducedMotion)this.cameraShake=.14;}
    else if(event.kind==='recover'&&receiver){receiver.broken=false;receiver.unit.brokenUntilRound=null;receiver.unit.shield=event.shieldAfter??receiver.unit.maxShield;this.floating(receiver,'RECOMPOSTO','#c1cbd0',.65);}
    else if(event.kind==='guard'&&receiver){receiver.guarding=true;receiver.shield.visible=true;this.floating(receiver,'DEFESA','#d6dfde',.7);}
    else if(event.kind==='heal'&&receiver){receiver.hp=event.hpAfter??Math.min(receiver.unit.maxHp,receiver.hp+(event.amount??0));this.floating(receiver,`+${event.amount??0}`,'#c7d5a1',1);}
    else if(event.kind==='boost'&&actor){this.floating(actor,`ÍMPETO ×${(event.hitCount??event.amount??1)}`,'#e7c584',.7);this.groundRing(actor);}
    else if(event.kind==='tactic'&&receiver){const label=event.action==='command'?'FORMAÇÃO':event.action==='observe'?'OBSERVAR':event.action==='cover'?'COBERTURA':event.action==='supply'?'SUPRIMENTO':'TÁTICA';this.floating(receiver,label,'#d9d9bc',.7);}
    else if(event.kind==='result'){this.resultContext=event.action==='victory'?'victory':'exhausted';const text=event.action==='victory'?'VITÓRIA':event.action==='defeat'?'RETIRADA':'ENCONTRO ENCERRADO';this.floatingAt(new THREE.Vector3(0,3,-.5),text,'#f1d49a',1.6,1.3);}
  }

  private arrow(){const group=new THREE.Group();this.cylinder(0,0,0,.016,.85,this.lit('#d6c5a2'),group);const tip=new THREE.Mesh(new THREE.ConeGeometry(.045,.16,3),this.lit('#cdd0c2'));tip.position.y=.48;group.add(tip);return group;}
  private floating(actor:Combatant,text:string,color:string,scale=1,delay=0){this.floatingAt(actor.group.position.clone().add(new THREE.Vector3(0,actor.height+.1,0)),text,color,scale,1.05,delay);}
  private floatingAt(position:THREE.Vector3,text:string,color:string,scale:number,duration:number,delay=0){const width=Math.max(160,text.length*35);const texture=canvasTexture(width,96,ctx=>{ctx.font=`bold ${text.length>12?40:58}px Georgia,serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#111b22';ctx.shadowBlur=8;ctx.lineWidth=7;ctx.strokeStyle='#172129';ctx.strokeText(text,width/2,50);ctx.fillStyle=color;ctx.fillText(text,width/2,50);});const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false});const sprite=new THREE.Sprite(material);sprite.position.copy(position);sprite.scale.set(width/96*scale,.8*scale,1);sprite.renderOrder=20;this.effectsRoot.add(sprite);this.effects.push({object:sprite,age:-delay,duration,update:p=>{sprite.visible=p>=0;sprite.position.y=position.y+Math.max(0,p)*.72;material.opacity=Math.min(1,(1-p)*3);},dispose:()=>texture.dispose()});}
  private impactTrail(actor:Combatant,weapon:WeaponType,direction:number){const material=new THREE.MeshBasicMaterial({color:weapon==='staff'?'#c3a87a':weapon==='bow'?'#d6d3bd':'#ffedbf',transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false});const geometry=weapon==='spear'||weapon==='bow'?new THREE.PlaneGeometry(1.35,.055):new THREE.RingGeometry(.58,.73,28,1,Math.PI*.1,Math.PI*.85);const mesh=new THREE.Mesh(geometry,material);mesh.position.copy(actor.group.position).add(new THREE.Vector3(0,1.45,.12));mesh.quaternion.copy(this.options.camera.quaternion);mesh.rotation.z+=direction*.45;this.effectsRoot.add(mesh);this.effects.push({object:mesh,age:0,duration:.22,update:p=>{material.opacity=(1-p)*.95;mesh.scale.setScalar(.8+p*.45);}});}
  private particles(position:THREE.Vector3,color:string,count:number,shards=false){const rnd=random(this.eventsPlayed+51);for(let i=0;i<count;i++){const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}),mesh=new THREE.Mesh(shards?new THREE.TetrahedronGeometry(.07+rnd()*.04):new THREE.PlaneGeometry(.025+rnd()*.04,.025+rnd()*.04),material),velocity=new THREE.Vector3((rnd()-.5)*3,.7+rnd()*1.5,(rnd()-.5)*1.2);mesh.position.copy(position);this.effectsRoot.add(mesh);this.effects.push({object:mesh,age:0,duration:.45+rnd()*.25,update:(p,dt)=>{mesh.position.addScaledVector(velocity,dt);velocity.y-=dt*4;mesh.rotation.z+=dt*5;material.opacity=1-p;}});}}
  private groundRing(actor:Combatant){const material=new THREE.MeshBasicMaterial({color:'#d5b46f',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}),ring=new THREE.Mesh(new THREE.RingGeometry(.48,.53,32),material);ring.rotation.x=-Math.PI/2;ring.position.copy(actor.group.position);ring.position.y=.025;this.effectsRoot.add(ring);this.effects.push({object:ring,age:0,duration:.65,update:p=>{ring.scale.setScalar(1+p*.5);material.opacity=(1-p)*.3;}});}

  update(dt:number){if(this.disposed)return;this.time+=dt;this.introduction=Math.min(1,this.introduction+dt/1.1);for(const actor of this.units.values())actor.body.quaternion.copy(this.options.camera.quaternion);const animation=this.current;if(animation){animation.age+=dt;const progress=Math.min(1,animation.age/animation.duration);animation.update(progress);let justImpacted=false;if(!animation.impacted&&progress>=animation.impact){animation.impacted=true;justImpacted=true;animation.hit();}
      // Keep the impact callback visible for a rendered frame before the queue can resolve.
      if(progress>=1&&!justImpacted){animation.finish();this.current=null;animation.resolve();}}
    for(const actor of this.units.values()){
      const acting=this.activeActorId===actor.unit.id,receiving=animation?.event.kind==='hit'&&animation.event.targetId===actor.unit.id,frames=this.getFrames(actor.unit);if(frames){const direction=actor.unit.side==='ally'?3:1,frame=acting&&animation?.event.kind==='hit'?Math.min(3,Math.floor(animation.age/animation.duration*4)):Math.floor(this.time*2+actor.phase)%2;actor.body.material.map=frames[direction]?.[frame]??frames[0][frame];}
      const usesDirectionalHero=actor.unit.id==='gideon'||actor.unit.id==='gideao';actor.body.scale.x=usesDirectionalHero||frames?.[0]?.[0]?.userData.directionalPeople?1:actor.unit.side==='ally'?-1:1;
      let firstMap=frames?.[0]?.[0];
      if(usesDirectionalHero&&this.options.heroActions){const context:CharacterContext=receiving?'hurt':acting&&animation?.event.kind==='hit'?'attack':actor.guarding?'guard':this.resultContext??(actor.hp<actor.unit.maxHp*.25?'exhausted':'ready'),actionFrames=this.options.heroActions(context);if(actionFrames.length){const frame=animation&&(acting||receiving)?Math.min(actionFrames.length-1,Math.floor(animation.age/animation.duration*actionFrames.length)):Math.floor(this.time*2)%actionFrames.length;actor.body.material.map=actionFrames[frame];firstMap=actionFrames[0];actor.body.scale.x=1;}}
      const spriteAspect=firstMap?.userData.spriteAspect as number|undefined,visibleRatio=firstMap?.userData.visibleHeight as number|undefined,planeHeight=spriteAspect?actor.height/(visibleRatio??1):actor.height;
      if(spriteAspect){actor.body.scale.x*=(planeHeight*spriteAspect)/actor.width;actor.body.scale.y=planeHeight/actor.height;}
      actor.body.position.y=planeHeight/2-planeHeight*(firstMap?.userData.baselineRatio??0)+Math.sin(this.time*2+actor.phase)*.016-(actor.broken?.18:0);actor.shield.quaternion.copy(this.options.camera.quaternion);actor.shield.visible=actor.guarding&&!actor.broken;
      if(!acting&&!receiving)actor.body.rotation.z=this.options.camera.rotation.z+(actor.broken?(actor.unit.side==='enemy'?.12:-.12):0);
      if(actor.hp<=0){actor.body.rotation.z=actor.unit.side==='enemy'?.25:-.25;actor.body.material.opacity=THREE.MathUtils.lerp(actor.body.material.opacity,.24,1-Math.exp(-dt*4));}
    }
    for(let i=this.effects.length-1;i>=0;i--){const effect=this.effects[i];effect.age+=dt;const progress=effect.age/effect.duration;effect.update(progress,dt);if(progress>=1){effect.dispose?.();this.removeEffectObject(effect.object);this.effects.splice(i,1);}}
    for(const flame of this.flames){const pulse=1+Math.sin(this.time*13+flame.phase)*.13;flame.mesh.scale.y=pulse;if(flame.light)flame.light.intensity=9*pulse;}
    for(let i=0;i<this.wind.length;i++)this.wind[i].rotation.z=Math.sin(this.time*1.2+i)*.012;for(const item of this.authoredWind)item.object.rotation.z=item.base+Math.sin(this.time*.85+item.phase)*item.strength;this.cameraShake=Math.max(0,this.cameraShake-dt*.6);this.updateCamera(dt);this.layoutTime+=dt;if(this.layoutTime>.1){this.emitLayout();this.layoutTime=0;}
  }
  private updateCamera(_dt:number){const camera=this.options.camera,intro=this.reducedMotion?1:this.introduction,ease=intro*intro*(3-2*intro);camera.position.copy(this.cameraBase).add(new THREE.Vector3(0,(1-ease)*.7,(1-ease)*1.5));if(!this.reducedMotion)camera.position.x+=Math.sin(this.time*45)*this.cameraShake;camera.lookAt(this.target);camera.zoom=.96+.04*ease;camera.updateProjectionMatrix();}
  getFocusDistance(){return this.options.camera.position.distanceTo(this.target);}
  getFocusPoints(){const event=this.current?.event,actor=event?this.units.get(event.actorId):undefined,target=event?this.units.get(event.targetId??''):undefined;return{primary:actor?.group.position.clone().add(new THREE.Vector3(0,1.2,0))??new THREE.Vector3(-2,1.2,-2.5),secondary:target?.group.position.clone().add(new THREE.Vector3(0,1.2,0))??new THREE.Vector3(2,1.2,1)};}
  getLayout():BattleLayout {const camera=this.options.camera;return{units:[...this.units.values()].map(actor=>{const head=actor.group.position.clone().add(new THREE.Vector3(0,actor.height+.22,0)).project(camera),foot=actor.group.position.clone().project(camera);return{id:actor.unit.id,x:(foot.x+1)/2,y:(1-foot.y)/2,headY:(1-head.y)/2,footY:(1-foot.y)/2,side:actor.unit.side,visible:actor.group.visible};}),animating:!!this.current,activeActorId:this.activeActorId};}
  private emitLayout(){this.options.onLayout?.(this.getLayout());}
  getDebugInfo(){
    const bindings=new Set<LitMaterial>();this.environment.traverse(object=>{if(object instanceof THREE.Mesh)for(const material of Array.isArray(object.material)?object.material:[object.material])if((material instanceof THREE.MeshStandardMaterial||material instanceof THREE.MeshLambertMaterial)&&(material.userData.surfaceId||material.userData.environmentGround))bindings.add(material);});
    const mappedBySurface:Record<string,number>={};let pendingBindings=0,authoredGround=false;
    for(const material of bindings){const role=material.userData.environmentGround??material.userData.surfaceId;if(!material.map)pendingBindings++;else mappedBySurface[role]=(mappedBySurface[role]??0)+1;if(material.userData.environmentGround==='ground')authoredGround=material.map?.name==='Authored battle clay';}
    const authoredMaterialsReady=!!this.materialAtlasSource&&pendingBindings===0;
    return{active:true,arenaInstance:this.root.uuid,authoredMaterialsReady,authoredMaterialCount:bindings.size-pendingBindings,region:this.options.region,eventsPlayed:this.eventsPlayed,animating:!!this.current,currentEvent:this.current?.event.id??null,activeActorId:this.activeActorId,environmentMaterials:{ready:authoredMaterialsReady,sourceCount:Object.keys(this.options.textures.surfaces??{}).length,pendingBindings,mappedBySurface,authoredGround,refreshes:this.environmentRefreshes},units:[...this.units.values()].map(actor=>({id:actor.unit.id,side:actor.unit.side,hp:actor.hp,x:actor.group.position.x,z:actor.group.position.z,visible:actor.group.visible,broken:actor.broken,directionalSprite:!!this.getFrames(actor.unit)?.[0]?.[0]?.userData.directionalPeople,mirrored:actor.body.scale.x<0})),layout:this.getLayout()};
  }

  private removeEffectObject(object:THREE.Object3D){object.removeFromParent();object.traverse(child=>{if(child instanceof THREE.Mesh){child.geometry.dispose();const materials=Array.isArray(child.material)?child.material:[child.material];materials.forEach(material=>{if(![...this.materials.values()].includes(material as LitMaterial))material.dispose();});}else if(child instanceof THREE.Sprite)child.material.dispose();});}
  dispose(){if(this.disposed)return;this.disposed=true;if(this.current){this.current.finish();this.current.resolve();this.current=null;}this.effects.forEach(effect=>effect.dispose?.());this.effects.length=0;this.root.removeFromParent();const geometry=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();this.root.traverse(child=>{if(child instanceof THREE.Mesh||child instanceof THREE.Points){geometry.add(child.geometry);(Array.isArray(child.material)?child.material:[child.material]).forEach(material=>materials.add(material));}else if(child instanceof THREE.Sprite)materials.add(child.material);});geometry.forEach(g=>g.dispose());this.materials.forEach(m=>materials.add(m));materials.forEach(m=>m.dispose());this.ownedTextures.forEach(t=>t.dispose());this.units.clear();}
}
