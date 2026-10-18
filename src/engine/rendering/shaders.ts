/** One inexpensive colour/diorama pass also used on mobile and software renderers. */
export const DioramaGradeShader = {
  uniforms: {tDiffuse:{value:null},texel:{value:null},focalPoints:{value:null},blurPixels:{value:.7},economicBloom:{value:.08},bloomThreshold:{value:2.35},saturation:{value:1},contrast:{value:1},shadowTint:{value:null},highlightTint:{value:null},aspect:{value:1}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
    varying vec2 vUv;uniform sampler2D tDiffuse;uniform vec2 texel;uniform vec4 focalPoints;
    uniform float blurPixels,economicBloom,bloomThreshold,saturation,contrast,aspect;
    uniform vec3 shadowTint,highlightTint;
    float lightness(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
    vec3 luminous(vec3 c){return c*smoothstep(bloomThreshold,bloomThreshold+.65,lightness(c));}
    void main(){
      vec3 original=texture2D(tDiffuse,vUv).rgb;
      float band=smoothstep(.27,.49,abs(vUv.y-focalPoints.y));
      float protectA=1.0-smoothstep(.13,.28,length((vUv-focalPoints.xy)*vec2(aspect,1.0)));
      float protectB=1.0-smoothstep(.1,.23,length((vUv-focalPoints.zw)*vec2(aspect,1.0)));
      vec2 offset=texel*blurPixels*band*(1.0-max(protectA,protectB));
      vec3 colour=original*.5;
      colour+=texture2D(tDiffuse,vUv+vec2(offset.x,0.0)).rgb*.125;
      colour+=texture2D(tDiffuse,vUv-vec2(offset.x,0.0)).rgb*.125;
      colour+=texture2D(tDiffuse,vUv+vec2(0.0,offset.y)).rgb*.125;
      colour+=texture2D(tDiffuse,vUv-vec2(0.0,offset.y)).rgb*.125;
      if(economicBloom>.001){
        vec2 reach=texel*2.4;
        vec3 halo=luminous(texture2D(tDiffuse,vUv+vec2(reach.x,0.0)).rgb)+luminous(texture2D(tDiffuse,vUv-vec2(reach.x,0.0)).rgb);
        halo+=luminous(texture2D(tDiffuse,vUv+vec2(0.0,reach.y)).rgb)+luminous(texture2D(tDiffuse,vUv-vec2(0.0,reach.y)).rgb);
        colour+=halo*.25*economicBloom;
      }
      float luminance=lightness(colour);
      colour=mix(vec3(luminance),colour,saturation);
      colour*=mix(shadowTint,highlightTint,smoothstep(.08,1.2,luminance));
      colour=(colour-vec3(.18))*contrast+vec3(.18);
      gl_FragColor=vec4(max(colour,vec3(0.0)),1.0);
    }`,
};
/** Nine taps replace BokehShader's 41; a broad focal slab keeps nearby actors sharp. */
export const ProtectedDepthFragment = `
  #include <common>
  #include <packing>
  varying vec2 vUv;uniform sampler2D tColor;uniform sampler2D tDepth;
  uniform float focus,aspect,nearClip,farClip,aperture,maxblur;
  uniform vec4 protectedPoints;uniform float sharpDepth;
  float depthAt(vec2 uv){return unpackRGBAToDepth(texture2D(tDepth,uv));}
  void main(){
    float viewZ=orthographicDepthToViewZ(depthAt(vUv),nearClip,farClip);
    float difference=max(0.0,abs(focus+viewZ)-sharpDepth);
    float protectA=1.0-smoothstep(.12,.25,length((vUv-protectedPoints.xy)*vec2(aspect,1.0)));
    float protectB=1.0-smoothstep(.1,.21,length((vUv-protectedPoints.zw)*vec2(aspect,1.0)));
    float radius=min(maxblur,difference*aperture)*(1.0-max(protectA,protectB));
    vec2 d=vec2(radius,radius*aspect);
    vec3 c=texture2D(tColor,vUv).rgb*.2;
    c+=texture2D(tColor,vUv+vec2(d.x,0.0)).rgb*.12;c+=texture2D(tColor,vUv-vec2(d.x,0.0)).rgb*.12;
    c+=texture2D(tColor,vUv+vec2(0.0,d.y)).rgb*.12;c+=texture2D(tColor,vUv-vec2(0.0,d.y)).rgb*.12;
    c+=texture2D(tColor,vUv+d*.707).rgb*.08;c+=texture2D(tColor,vUv-d*.707).rgb*.08;
    c+=texture2D(tColor,vUv+vec2(d.x,-d.y)*.707).rgb*.08;c+=texture2D(tColor,vUv+vec2(-d.x,d.y)*.707).rgb*.08;
    gl_FragColor=vec4(c,1.0);
  }
`;
