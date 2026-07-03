import React, { useRef, useMemo, useEffect, useState, Component } from "react";
import { Canvas, useFrame, useGraph } from "@react-three/fiber";
import {
    PerspectiveCamera,
    OrbitControls,
    Environment,
    ContactShadows,
    Html,
    useGLTF,
    useTexture,
    Stars,
    Grid,
    useFBX,
    useAnimations
} from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";



class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white p-10 text-center">
                    <h2 className="text-xl font-bold mb-4 text-cyan-400">¡Ups! Algo salió mal con Nova</h2>
                    <p className="text-sm text-slate-400 mb-6">Parece que hubo un error al cargar los archivos de animación.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-bold transition-colors"
                    >
                        REINTENTAR CARGA
                    </button>
                    {this.state.error && (
                        <pre className="mt-8 p-4 bg-black/50 rounded text-[10px] text-red-400 max-w-full overflow-auto">
                            {this.state.error.message}
                        </pre>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}



const lerp = THREE.MathUtils.lerp;



function applyFacialLogic(nodes, isSpeaking, avatarExpression, time) {
    Object.values(nodes).forEach(node => {
        if (!node.morphTargetInfluences) return;
        const dict = node.morphTargetDictionary || {};
        const inf = node.morphTargetInfluences;

        
        const blink = (time % 4) < 0.2 ? 1 : 0;
        ['eyeBlinkLeft', 'eyeBlinkRight', 'blink', 'eyesClosed'].forEach(key => {
            if (dict[key] !== undefined) inf[dict[key]] = THREE.MathUtils.lerp(inf[dict[key]], blink, 0.8);
        });

        
        const talkCycle = Math.sin(time * 15) * 0.5 + 0.5;
        const intensity = isSpeaking ? talkCycle : 0;
        const jawTargets = ['jawOpen', 'mouthOpen', 'viseme_aa', 'viseme_O'];
        jawTargets.forEach(key => {
            if (dict[key] !== undefined) inf[dict[key]] = THREE.MathUtils.lerp(inf[dict[key]], intensity * 0.15, 0.4);
        });

        
        let targetSmile = 0.15;
        let targetBrowInnerUp = 0.0;
        let targetBrowDown = 0.0;
        let targetFrown = 0.0;

        if (avatarExpression === 'alegre' || avatarExpression === 'joy') {
            targetSmile = 0.7;
            targetBrowInnerUp = 0.2;
        } else if (avatarExpression === 'explicando') {
            targetSmile = 0.3;
            targetBrowInnerUp = 0.4;
        } else if (avatarExpression === 'preocupada') {
            targetSmile = 0.0;
            targetBrowDown = 0.6;
            targetFrown = 0.5;
        }

        
        if (isSpeaking && avatarExpression !== 'preocupada') {
            targetSmile = Math.min(targetSmile, 0.4);
        }

        
        if (dict['mouthSmile'] !== undefined) {
            inf[dict['mouthSmile']] = THREE.MathUtils.lerp(inf[dict['mouthSmile']], targetSmile, 0.15);
        }

        
        if (dict['browInnerUp'] !== undefined) {
            inf[dict['browInnerUp']] = THREE.MathUtils.lerp(inf[dict['browInnerUp']], targetBrowInnerUp, 0.15);
        }

        
        ['browDownLeft', 'browDownRight'].forEach(key => {
            if (dict[key] !== undefined) {
                inf[dict[key]] = THREE.MathUtils.lerp(inf[dict[key]], targetBrowDown, 0.15);
            }
        });

        
        ['mouthFrownLeft', 'mouthFrownRight', 'mouthFrown'].forEach(key => {
            if (dict[key] !== undefined) {
                inf[dict[key]] = THREE.MathUtils.lerp(inf[dict[key]], targetFrown, 0.15);
            }
        });
    });
}



const AvatarModel = ({ isGreeting, isSpeaking, isListening, mouthLevel, isDancing, avatarExpression, onLoaded }) => {
    const { scene } = useGLTF("/nova_base.glb");
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
    const { nodes } = useGraph(clone);

    
    const reposoFBX = useFBX("/animations/reposo.fbx");
    const saludoFBX = useFBX("/animations/saludo.fbx");
    const dancingFBX = useFBX("/animations/dancing.fbx");
    

    const animations = useMemo(() => {
        const clean = (fbx, name) => {
            if (!fbx || !fbx.animations || !fbx.animations[0]) return null;
            const clip = fbx.animations[0].clone();
            clip.name = name;

            
            clip.tracks = clip.tracks.filter(track => !track.name.includes(".scale"));
            clip.tracks.forEach(track => {
                
                track.name = track.name.replace(/mixamorig:?/gi, "").replace(/mixamorig_?/gi, "").replace(/.*[:|]/g, "");

                
                if (track.name.includes("Hips.position")) {
                    for (let i = 0; i < track.values.length; i++) track.values[i] *= 0.01;
                }
            });
            return clip;
        };
        return [
            clean(reposoFBX, "reposo"),
            clean(saludoFBX, "saludo"),
            clean(dancingFBX, "baile")
        ].filter(Boolean);
    }, [reposoFBX, saludoFBX, dancingFBX]);

    const { actions } = useAnimations(animations, clone);

    useEffect(() => {
        if (!actions || !actions.reposo) return;

        
        let nextActionName = "reposo";
        if (isDancing && actions.baile) {
            nextActionName = "baile";
        } else if (isGreeting && actions.saludo) {
            nextActionName = "saludo";
        }

        
        Object.values(actions).forEach(action => {
            if (action && action.isRunning() && action.getClip().name !== nextActionName) {
                action.fadeOut(0.5);
            }
        });

        const nextAction = actions[nextActionName];
        if (nextAction && !nextAction.isRunning()) {
            nextAction.reset().setEffectiveWeight(1).fadeIn(0.5).play();
        }
    }, [isGreeting, isDancing, actions]);

    
    useEffect(() => {
        return () => {
            if (clone) {
                console.log("♻️ Desmontando AvatarModel: Liberando GPU y RAM...");
                clone.traverse((object) => {
                    if (object.isMesh) {
                        
                        if (object.geometry) object.geometry.dispose();

                        
                        if (object.material) {
                            const materials = Array.isArray(object.material) ? object.material : [object.material];
                            materials.forEach(material => {
                                
                                Object.keys(material).forEach(key => {
                                    if (material[key] && material[key].isTexture) {
                                        material[key].dispose();
                                    }
                                });
                                material.dispose();
                            });
                        }
                    }
                });

                
                if (actions) {
                    Object.values(actions).forEach(action => {
                        if (action) action.stop();
                    });
                }
            }
        };
    }, [clone, actions]);

    useEffect(() => {
        if (onLoaded) {
            onLoaded();
        }
    }, [onLoaded]);

    useFrame((state) => {
        applyFacialLogic(nodes, isSpeaking, avatarExpression, state.clock.elapsedTime);
    });

    return (
        <group scale={1.45} position={[0, -1.35, 0]}>
            <primitive object={clone} />
        </group>
    );
};



const BioFireflies = ({ count = 40 }) => {
    const mesh = useRef();
    const [particles] = useState(() => {
        const p = [];
        for (let i = 0; i < count; i++) {
            p.push({
                t: Math.random() * 100,
                speed: 0.1 + Math.random() * 0.2,
                radius: 2.0 + Math.random() * 2.0,
                yOffset: (Math.random() - 0.5) * 4,
                size: 0.02 + Math.random() * 0.2
            });
        }
        return p;
    });

    const dummy = useMemo(() => new THREE.Object3D(), []);

    useFrame((state) => {
        particles.forEach((p, i) => {
            p.t += p.speed * 0.03;
            const x = Math.cos(p.t) * p.radius + Math.sin(p.t * 0.7) * 0.3;
            const z = Math.sin(p.t) * p.radius + Math.cos(p.t * 0.8) * 0.3;
            const y = p.yOffset + Math.sin(p.t * 0.4) * 0.8;
            dummy.position.set(x, y, z);
            const isFront = z > 0;
            const sizeModifier = isFront ? 0.001 : 0.15;
            const glow = Math.sin(p.t * 4) * 0.3 + 0.7;
            dummy.scale.setScalar(glow * p.size + sizeModifier);
            dummy.updateMatrix();
            mesh.current.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[null, null, count]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial
                color="#00d4ff"
                emissive="#00d4ff"
                emissiveIntensity={15}
                toneMapped={false}
            />
        </instancedMesh>
    );
};



export default function Avatar3D(props) {
    const { showIntro } = props;
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return (
        <ErrorBoundary>
            <div className="w-full h-full">
                <Canvas 
                    shadows={!isMobile} 
                    dpr={isMobile ? Math.min(window.devicePixelRatio, 1.5) : [1, 1.5]} 
                    gl={{ antialias: true, powerPreference: "high-performance" }}
                >
                    <PerspectiveCamera makeDefault position={isMobile ? [0, 0.4, 5.2] : [0, 2.5, 6.5]} fov={isMobile ? 30 : 28} />

                    <React.Suspense
                        fallback={
                            showIntro ? null : (
                                <Html center>
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                                        <span className="text-cyan-400 font-bold text-lg">
                                            Cargando Avatar NOVA.IA...
                                        </span>
                                    </div>
                                </Html>
                            )
                        }
                    >
                        <hemisphereLight skyColor="#00d4ff" groundColor="#080710" intensity={isMobile ? 1.0 : 0.5} />
                        <ambientLight intensity={isMobile ? 1.2 : 0.8} />
                        {!isMobile && <Environment preset="city" environmentIntensity={0.6} />}
                        <directionalLight position={[5, 7, 6]} intensity={1.5} />
                        <pointLight position={[-5, 2, 2]} intensity={0.4} color="#ffffff" />
                        <pointLight position={[0, 5, -5]} intensity={isMobile ? 1.0 : 1.5} color="#ffffff" distance={15} />

                        <group position={[0, -0.4, 0]}>
                            <AvatarModel {...props} />
                        </group>

                        <ContactShadows
                            position={[0, -1.94, 0]}
                            opacity={0.6}
                            blur={isMobile ? 3.0 : 2.5}
                            far={5}
                            resolution={isMobile ? 128 : 256}
                        />
                    </React.Suspense>

                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        target={isMobile ? [0, -0.4, 0] : [0, -0.55, 0]}
                        minPolarAngle={Math.PI / 3.5}
                        maxPolarAngle={Math.PI / 1.7}
                        minAzimuthAngle={-Math.PI / 6}
                        maxAzimuthAngle={Math.PI / 6}
                        enableDamping
                        dampingFactor={0.05}
                    />
                </Canvas>
            </div>
        </ErrorBoundary>
    );
}
