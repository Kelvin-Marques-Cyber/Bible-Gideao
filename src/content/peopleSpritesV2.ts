/** Original generated NPC sheets. Explicit alpha-derived crops avoid the approximate source grid. */
export type PeopleKindV2 = 'pura' | 'woman' | 'elder' | 'guard';
export type PeopleDirectionV2 = 'front' | 'right' | 'back' | 'left';
export interface PeopleFrameV2 {
  readonly x:number; readonly y:number; readonly width:number; readonly height:number;
  /** Horizontal foot centre and ground line, relative to the source crop. */
  readonly anchorX:number; readonly baseline:number;
}
export interface PeopleSheetV2 {
  readonly url:string; readonly width:number; readonly height:number; readonly referenceHeight:number;
  readonly frames:readonly (readonly PeopleFrameV2[])[];
}
export const peopleAtlasV2 = {
  columns:4, rows:4, directions:['front','right','back','left'],
  canvasWidth:256, canvasHeight:160, visibleHeight:152, baseline:3,
  /** Match Mesh alphaTest .35 when cleaning isolated generated spill. */
  alphaThreshold:90, keepLargestComponent:true,
  characters:{
    pura:{url:'assets/people-pura-walk-v2.png',width:1254,height:1254,referenceHeight:298,frames:[
      [{x:106,y:22,width:170,height:297,anchorX:82.8,baseline:297},{x:403,y:21,width:160,height:298,anchorX:76.3,baseline:298},{x:688,y:22,width:164,height:297,anchorX:85.3,baseline:297},{x:980,y:22,width:170,height:297,anchorX:81.2,baseline:297}],
      [{x:103,y:328,width:183,height:296,anchorX:91.6,baseline:296},{x:393,y:329,width:182,height:295,anchorX:96,baseline:295},{x:684,y:331,width:191,height:294,anchorX:97.3,baseline:294},{x:976,y:326,width:190,height:297,anchorX:95.9,baseline:297}],
      [{x:98,y:637,width:171,height:291,anchorX:88.6,baseline:291},{x:391,y:637,width:167,height:292,anchorX:88.3,baseline:292},{x:681,y:639,width:167,height:289,anchorX:84,baseline:289},{x:973,y:638,width:171,height:291,anchorX:89.3,baseline:291}],
      [{x:84,y:935,width:190,height:291,anchorX:92.5,baseline:291},{x:381,y:936,width:195,height:291,anchorX:95.1,baseline:291},{x:663,y:937,width:190,height:290,anchorX:92.1,baseline:290},{x:960,y:934,width:195,height:292,anchorX:95.4,baseline:292}],
    ]},
    woman:{url:'assets/people-woman-walk-v2.png',width:1254,height:1254,referenceHeight:286,frames:[
      [{x:134,y:26,width:147,height:284,anchorX:71.9,baseline:284},{x:417,y:26,width:146,height:284,anchorX:74.4,baseline:284},{x:686,y:26,width:150,height:284,anchorX:75.9,baseline:284},{x:972,y:26,width:144,height:284,anchorX:70.8,baseline:284}],
      [{x:129,y:331,width:181,height:282,anchorX:89.1,baseline:282},{x:393,y:331,width:184,height:282,anchorX:99.3,baseline:282},{x:673,y:332,width:181,height:281,anchorX:91.2,baseline:281},{x:950,y:332,width:183,height:281,anchorX:98.4,baseline:281}],
      [{x:133,y:634,width:156,height:283,anchorX:67.3,baseline:283},{x:413,y:634,width:155,height:283,anchorX:77,baseline:283},{x:688,y:634,width:154,height:283,anchorX:68.4,baseline:283},{x:965,y:634,width:158,height:283,anchorX:75.7,baseline:283}],
      [{x:106,y:934,width:182,height:286,anchorX:90.9,baseline:286},{x:395,y:934,width:187,height:286,anchorX:87.3,baseline:286},{x:664,y:934,width:187,height:286,anchorX:91,baseline:286},{x:949,y:934,width:188,height:286,anchorX:87.5,baseline:286}],
    ]},
    elder:{url:'assets/people-elder-walk-v2.png',width:1254,height:1254,referenceHeight:294,frames:[
      [{x:124,y:32,width:175,height:292,anchorX:79.2,baseline:292},{x:404,y:32,width:175,height:292,anchorX:81.1,baseline:292},{x:685,y:32,width:175,height:291,anchorX:81.4,baseline:291},{x:968,y:32,width:170,height:291,anchorX:78.5,baseline:291}],
      [{x:107,y:331,width:188,height:289,anchorX:99.3,baseline:289},{x:389,y:331,width:189,height:289,anchorX:104.6,baseline:289},{x:672,y:332,width:194,height:288,anchorX:103.4,baseline:288},{x:963,y:331,width:186,height:289,anchorX:99.7,baseline:289}],
      [{x:112,y:633,width:179,height:292,anchorX:92.5,baseline:292},{x:403,y:632,width:170,height:293,anchorX:83.6,baseline:293},{x:683,y:633,width:177,height:294,anchorX:85.3,baseline:294},{x:964,y:632,width:175,height:294,anchorX:85.9,baseline:294}],
      [{x:101,y:937,width:208,height:285,anchorX:94,baseline:285},{x:381,y:937,width:205,height:285,anchorX:94.2,baseline:285},{x:665,y:937,width:203,height:285,anchorX:92.3,baseline:285},{x:954,y:935,width:200,height:287,anchorX:94.1,baseline:287}],
    ]},
    guard:{url:'assets/people-guard-walk-v2.png',width:1254,height:1254,referenceHeight:297,frames:[
      [{x:163,y:15,width:147,height:292,anchorX:80.1,baseline:292},{x:450,y:15,width:136,height:293,anchorX:64.6,baseline:293},{x:711,y:14,width:135,height:295,anchorX:66.9,baseline:295},{x:986,y:15,width:137,height:292,anchorX:63.7,baseline:292}],
      [{x:155,y:321,width:151,height:295,anchorX:75.4,baseline:295},{x:427,y:321,width:163,height:295,anchorX:82.2,baseline:295},{x:689,y:319,width:162,height:297,anchorX:79.9,baseline:297},{x:964,y:321,width:162,height:293,anchorX:82.5,baseline:293}],
      [{x:169,y:635,width:140,height:294,anchorX:71.7,baseline:294},{x:449,y:635,width:137,height:293,anchorX:64,baseline:293},{x:709,y:637,width:140,height:291,anchorX:66.1,baseline:291},{x:989,y:636,width:136,height:293,anchorX:63.8,baseline:293}],
      [{x:158,y:937,width:167,height:287,anchorX:82.9,baseline:287},{x:436,y:935,width:163,height:290,anchorX:80.4,baseline:290},{x:697,y:935,width:169,height:290,anchorX:81.4,baseline:290},{x:979,y:938,width:165,height:287,anchorX:79.9,baseline:287}],
    ]},
  },
} as const satisfies {
  columns:number;rows:number;directions:readonly PeopleDirectionV2[];
  canvasWidth:number;canvasHeight:number;visibleHeight:number;baseline:number;
  alphaThreshold:number;keepLargestComponent:boolean;
  characters:Record<PeopleKindV2,PeopleSheetV2>;
};

/** drawImage destination: the source foot anchor always lands at (128,157). */
export function placePeopleFrame(frame:PeopleFrameV2,referenceHeight:number) {
  const scale=peopleAtlasV2.visibleHeight/referenceHeight;
  return {
    x:peopleAtlasV2.canvasWidth/2-frame.anchorX*scale,
    y:peopleAtlasV2.canvasHeight-peopleAtlasV2.baseline-frame.baseline*scale,
    width:frame.width*scale,height:frame.height*scale,
  };
}

