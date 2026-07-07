import { useEffect, useRef } from "react";

export default function ShaderBackground() {

    const canvasRef = useRef(null);

    useEffect(() => {

        const canvas = canvasRef.current;

        if (!canvas) return;

        const gl =
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl");

        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        function resizeCanvas() {

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            gl.viewport(
                0,
                0,
                canvas.width,
                canvas.height
            );
        }

        resizeCanvas();

        const vertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

        const fragmentShaderSource = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {

    vec2 uv = v_texCoord;

    float time = u_time * 0.4;

    vec2 p = uv * 2.0 - 1.0;

    p.x *= u_resolution.x / u_resolution.y;

    for(float i = 1.0; i < 4.0; i++) {

        p.x += 0.3 / i * sin(i * 3.0 * p.y + time + i);

        p.y += 0.3 / i * cos(i * 3.0 * p.x + time + i);

    }

    float strength = 0.5 + 0.5 * sin(p.x + p.y);

    vec3 blush = vec3(0.88, 0.62, 0.78);

    vec3 amaranth = vec3(0.53, 0.01, 0.22);

    vec3 onyx = vec3(0.05, 0.05, 0.05);

    vec3 color = mix(
        onyx,
        mix(amaranth, blush, strength),
        strength * 0.6
    );

    gl_FragColor = vec4(color,1.0);

}
`;
        function createShader(type, source) {

            const shader = gl.createShader(type);

            gl.shaderSource(shader, source);

            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

                console.error(gl.getShaderInfoLog(shader));

                gl.deleteShader(shader);

                return null;

            }

            return shader;

        }

        const vertexShader = createShader(
            gl.VERTEX_SHADER,
            vertexShaderSource
        );

        const fragmentShader = createShader(
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );

        const program = gl.createProgram();

        gl.attachShader(program, vertexShader);

        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

            console.error(gl.getProgramInfoLog(program));

            return;

        }

        gl.useProgram(program);
        const vertices = new Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, 1,
        ]);

        const buffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.bufferData(
            gl.ARRAY_BUFFER,
            vertices,
            gl.STATIC_DRAW
        );

        const positionLocation = gl.getAttribLocation(
            program,
            "a_position"
        );

        gl.enableVertexAttribArray(positionLocation);

        gl.vertexAttribPointer(
            positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        const timeLocation = gl.getUniformLocation(
            program,
            "u_time"
        );

        const resolutionLocation = gl.getUniformLocation(
            program,
            "u_resolution"
        );

        let animationFrame;

        function render(time) {

            resizeCanvas();

            gl.uniform1f(
                timeLocation,
                time * 0.001
            );

            gl.uniform2f(
                resolutionLocation,
                canvas.width,
                canvas.height
            );

            gl.drawArrays(
                gl.TRIANGLE_STRIP,
                0,
                4
            );

            animationFrame =
                requestAnimationFrame(render);

        }

        animationFrame =
            requestAnimationFrame(render);

        window.addEventListener("resize", resizeCanvas);

        return () => {

            cancelAnimationFrame(animationFrame);

            window.removeEventListener(
                "resize",
                resizeCanvas
            );

        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 0,
                pointerEvents: "none",
            }}
        />
    );
}