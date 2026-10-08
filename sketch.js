/*
Pelota romántica: rebota muy alto por la pantalla, se convierte
en un corazón al tocar un borde y suena un "boing" con p5.sound.js.
El fondo es rojo oscuro con corazones y flores blancas, el título
"TE QUIERO" está centrado en serif blanca, y al mover el mouse brotan
partículas (regalos, copos de nieve y círculos blancos) que viven 20 segundos.
*/

// Polyfill: algunos navegadores (p. ej. Safari) no implementan
// AudioParam.cancelAndHoldAtTime(), que p5.sound necesita internamente
// para los cambios de volumen (amp) y frecuencia (freq). Sin esto,
// amp()/freq() lanzan "cancelAndHoldAtTime is not a function".
if (typeof AudioParam !== "undefined" && !AudioParam.prototype.cancelAndHoldAtTime) {
    AudioParam.prototype.cancelAndHoldAtTime = function (time) {
        // Alternativa: cancela los cambios futuros y mantiene el valor actual.
        this.cancelScheduledValues(time);
    };
}

// Colores
const ROJO_OSCURO = [105, 15, 32];  // fondo rojo romántico oscuro
const ROSA = [255, 182, 193];       // pelota / corazón

// Estado
let posX, posY;
let velX, velY;
let mostrandoCorazon = 0; // fotogramas restantes en modo "corazón"
let decoraciones = [];    // corazones y flores de fondo
let particulas = [];      // partículas generadas al mover el mouse

const RADIO = 25;       // radio de la pelota
const GRAVEDAD = 0.6;   // aceleración hacia abajo (más suave => rebota más alto)
const VIDA_PARTICULA = 20000; // 20 segundos de vida por partícula

let audioReady = false; // se activa con el primer gesto del usuario

function setup() {
    createCanvas(windowWidth, windowHeight);
    posX = width / 2;
    posY = 150;
    velX = random(-6, 6);
    velY = 0;
    generarDecoraciones();
}

// Crea corazones y flores repartidos por el fondo.
function generarDecoraciones() {
    decoraciones = [];
    for (let i = 0; i < 20; i++) {
        decoraciones.push({
            tipo: random() < 0.5 ? 'corazon' : 'flor',
            x: random(30, width - 30),
            y: random(40, height - 30),
            tam: random(14, 40),
            rot: random(TWO_PI),
            alfa: random(60, 160), // opacidad variable para dar profundidad
        });
    }
}

function draw() {
    background(...ROJO_OSCURO);
    noStroke();

    dibujarDecoraciones();
    dibujarTitulo();

    // Pelota (o corazón justo después de rebotar)
    fill(...ROSA);
    if (mostrandoCorazon > 0) {
        dibujarCorazon(posX, posY, 50);
        mostrandoCorazon--;
    } else {
        circle(posX, posY, RADIO * 2);
    }

    // Física de la pelota (se detiene si el cursor está encima)
    if (dist(mouseX, mouseY, posX, posY) >= RADIO) {
        velY += GRAVEDAD;
        posX += velX;
        posY += velY;

        // Rebote en los bordes laterales
        if (posX > width - RADIO) {
            posX = width - RADIO;
            velX = -abs(velX) * random(0.9, 1.05);
            rebotar();
        } else if (posX < RADIO) {
            posX = RADIO;
            velX = abs(velX) * random(0.9, 1.05);
            rebotar();
        }

        // Rebote en el suelo (muy alto)
        if (posY > height - RADIO) {
            posY = height - RADIO;
            velY = -abs(velY) * random(0.85, 1.0); // conserva casi toda la energía
            if (random() < 0.5) {
                velY -= random(8, 15);             // impulso extra para rebotar muy alto
            }
            velX += random(-0.5, 0.5);
            rebotar();
        }

        // Rebote en el techo
        if (posY < RADIO) {
            posY = RADIO;
            velY = abs(velY) * random(0.9, 1.0);
            rebotar();
        }

        velX = constrain(velX, -16, 16);
        velY = constrain(velY, -38, 38);
    }

    // Mueve y dibuja las partículas (siempre, aunque el mouse esté quieto)
    actualizarParticulas();
    dibujarParticulas();
}

// Título "TE QUIERO" centrado, grande y en serif blanca.
function dibujarTitulo() {
    const titulo = 'TE QUIERO';
    textFont('"Playfair Display"');
    textSize(Math.min(72, width / 8));
    textAlign(CENTER, CENTER);
    fill(255);
    text(titulo, width / 2, height / 2);
}

// Dibuja los corazones y flores de fondo en blanco semitransparente.
function dibujarDecoraciones() {
    noStroke();
    for (const d of decoraciones) {
        push();
        translate(d.x, d.y);
        rotate(d.rot);
        fill(255, 255, 255, d.alfa);
        if (d.tipo === 'corazon') {
            dibujarCorazon(0, 0, d.tam);
        } else {
            dibujarFlor(0, 0, d.tam);
        }
        pop();
    }
}

// Corazón centrado en (x, y) con ancho aproximado "tam".
function dibujarCorazon(x, y, tam) {
    const k = tam / 50;
    circle(x - 12 * k, y - 8 * k, 28 * k);                          // lóbulo izquierdo
    circle(x + 12 * k, y - 8 * k, 28 * k);                          // lóbulo derecho
    triangle(x - 24 * k, y - 2 * k, x + 24 * k, y - 2 * k, x, y + 22 * k); // punta
}

// Flor simple centrada en (x, y): pétalos alrededor de un centro.
function dibujarFlor(x, y, tam) {
    const r = tam / 2;
    const petalos = 6;
    for (let i = 0; i < petalos; i++) {
        const ang = (TWO_PI / petalos) * i;
        circle(x + cos(ang) * r * 0.55, y + sin(ang) * r * 0.55, r * 0.7);
    }
    circle(x, y, r * 0.5);
}

// Se ejecuta en cada rebote: muestra el corazón un instante y suena.
function rebotar() {
    mostrandoCorazon = 15; // ~0.25s en modo corazón

    if (!audioReady) return; // sin sonido hasta el primer clic

    const osc = new p5.Oscillator(random(350, 550), 'sine');
    osc.amp(0.0001, 0);                 // empieza en silencio (evita el clic)
    osc.start();
    osc.amp(0.6, 0.005);                // ataque rápido
    osc.freq(random(130, 190), 0.12);   // el tono cae
    osc.amp(0.0001, 0.18);              // se desvanece
    setTimeout(() => osc.stop(), 250);  // limpia el oscilador
}

// --- Partículas del mouse (solo se generan al moverlo) ---

// Crea una partícula aleatoria (regalo, copo de nieve o círculo) en (x, y).
function crearParticula(x, y) {
    if (particulas.length > 2500) return; // límite de seguridad
    const tipo = random(['regalo', 'copo', 'circulo']);
    const tam = tipo === 'circulo' ? random(4, 8)
        : tipo === 'copo' ? random(10, 18)
        : random(14, 24);
    particulas.push({
        tipo,
        x: x + random(-3, 3),
        y: y + random(-3, 3),
        vx: random(-1.2, 1.2),
        vy: random(-1.8, 0.4),
        tam,
        rot: random(TWO_PI),
        velRot: random(-0.05, 0.05),
        nacimiento: millis(),
        vida: VIDA_PARTICULA,
    });
}

// Genera partículas solo cuando el mouse se mueve.
function mouseMoved() {
    crearParticula(mouseX, mouseY);
}
function mouseDragged() {
    crearParticula(mouseX, mouseY);
}

// Mueve las partículas y elimina las que superan su tiempo de vida.
function actualizarParticulas() {
    const ahora = millis();
    for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        if (ahora - p.nacimiento > p.vida) {
            particulas.splice(i, 1);
            continue;
        }
        p.vx *= 0.98; // fricción suave
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.velRot;
    }
}

// Dibuja las partículas con un fundido según su vida restante.
function dibujarParticulas() {
    const ahora = millis();
    for (const p of particulas) {
        const vidaRestante = 1 - (ahora - p.nacimiento) / p.vida;
        dibujarParticula(p, 255 * vidaRestante);
    }
}

function dibujarParticula(p, alpha) {
    if (p.tipo === 'circulo') {
        noStroke();
        fill(255, 255, 255, alpha);
        circle(p.x, p.y, p.tam);
    } else if (p.tipo === 'copo') {
        dibujarCopo(p.x, p.y, p.tam, p.rot, alpha);
    } else {
        dibujarRegalo(p.x, p.y, p.tam, p.rot, alpha);
    }
}

// Copo de nieve: tres líneas cruzadas y un punto central.
function dibujarCopo(x, y, tam, rot, alpha) {
    push();
    translate(x, y);
    rotate(rot);
    const r = tam / 2;
    noFill();
    stroke(255, 255, 255, alpha);
    strokeWeight(1.5);
    for (let i = 0; i < 3; i++) {
        const ang = (PI / 3) * i;
        line(-cos(ang) * r, -sin(ang) * r, cos(ang) * r, sin(ang) * r);
    }
    noStroke();
    fill(255, 255, 255, alpha);
    circle(0, 0, tam * 0.22);
    pop();
}

// Regalo: caja blanca con cinta y lazo.
function dibujarRegalo(x, y, tam, rot, alpha) {
    push();
    translate(x, y);
    rotate(rot);
    const s = tam;
    noStroke();
    // caja
    fill(255, 255, 255, alpha);
    rect(-s / 2, -s / 4, s, s * 0.75);
    // cinta vertical (un poco más gris para que se distinga)
    fill(215, 215, 215, alpha);
    rect(-s * 0.08, -s / 4, s * 0.16, s * 0.75);
    // lazo
    fill(255, 255, 255, alpha);
    circle(-s * 0.22, -s * 0.34, s * 0.3);
    circle(s * 0.22, -s * 0.34, s * 0.3);
    pop();
}

// Los navegadores bloquean el audio hasta que hay un gesto del usuario
// (política de autoplay). El primer clic crea el AudioContext y activa el sonido.
function mousePressed() {
    if (!audioReady) {
        new p5.Oscillator(); // fuerza la creación del AudioContext dentro del gesto
        userStartAudio();    // reanuda el audio
        audioReady = true;
    }
}
