import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// A raw WebGL fragment-shader foil/holo shimmer, rendered as a full-card
// overlay. Reacts to pointer position for a parallax sheen. This is purely
// a finishing effect: it never affects zone geometry, fills, or text, and
// is hidden (data-export-hide) when the card is exported.
// ---------------------------------------------------------------------------

const VERTEX_SRC = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SRC = `
  precision mediump float;
  varying vec2 vUv;
  uniform vec2 uPointer;
  uniform float uIntensity;

  vec3 hueShift(vec3 color, float shift) {
    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
    float cosAngle = cos(shift);
    return color * cosAngle + cross(k, color) * sin(shift) + k * dot(k, color) * (1.0 - cosAngle);
  }

  void main() {
    vec2 uv = vUv;
    float diag = uv.x + uv.y;
    float pointerInfluence = 1.0 - distance(uv, uPointer) * 0.9;
    float band = sin(diag * 18.0 + uPointer.x * 6.0) * 0.5 + 0.5;
    vec3 base = vec3(0.9, 0.85, 0.6);
    vec3 shifted = hueShift(base, band * 6.283 + uPointer.y * 3.0);
    float alpha = smoothstep(0.0, 1.0, band) * clamp(pointerInfluence, 0.0, 1.0) * uIntensity;
    gl_FragColor = vec4(shifted, alpha * 0.35);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function ShaderOverlay({ enabled, intensity = 1 }: { enabled: boolean; intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC));
    gl.linkProgram(program);
    gl.useProgram(program);

    const quad = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    const uPointer = gl.getUniformLocation(program, "uPointer");
    const uIntensity = gl.getUniformLocation(program, "uIntensity");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uPointer, pointerRef.current.x, pointerRef.current.y);
      gl.uniform1f(uIntensity, intensity);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, intensity]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="shader-overlay"
      data-export-hide="true"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: (event.clientX - rect.left) / rect.width,
          y: 1 - (event.clientY - rect.top) / rect.height,
        };
      }}
    />
  );
}