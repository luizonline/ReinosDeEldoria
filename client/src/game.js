(() => {
  "use strict";
  const canvas = document.querySelector("#world");
  const ctx = canvas.getContext("2d");
  const notice = document.querySelector("#notice");
  const coords = document.querySelector("#coords");
  const WORLD_WIDTH = 2400;
  const WORLD_HEIGHT = 1800;
  const camera = { x: 0, y: 0 };
  const player = { x: 470, y: 420, targetX: 470, targetY: 420 };
  const guardian = { x: 700, y: 330 };
  const slime = { x: 1040, y: 650 };
  const houses = [
    { x: 350, y: 250, w: 150, h: 90 },
    { x: 820, y: 220, w: 180, h: 80 },
    { x: 540, y: 740, w: 250, h: 100 },
    { x: 1300, y: 430, w: 200, h: 120 },
    { x: 1700, y: 950, w: 260, h: 120 }
  ];
  let lastFrame = 0;

  function drawTree(x, y) {
    ctx.fillStyle = "#493b2b";
    ctx.fillRect(x - 5, y + 12, 10, 22);
    ctx.fillStyle = "#285333";
    ctx.beginPath();
    ctx.arc(x, y, 23, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWorld() {
    ctx.fillStyle = "#557b4b";
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    for (let y = 30; y < WORLD_HEIGHT; y += 80) {
      for (let x = 30; x < WORLD_WIDTH; x += 90) {
        ctx.fillStyle = "#628552";
        ctx.fillRect(x, y, 3, 3);
      }
    }

    ctx.strokeStyle = "#9b8758";
    ctx.lineWidth = 90;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(80, 510);
    ctx.bezierCurveTo(500, 560, 720, 500, 980, 720);
    ctx.bezierCurveTo(1300, 900, 1500, 700, 2200, 900);
    ctx.stroke();

    for (let x = 100; x < WORLD_WIDTH; x += 170) {
      for (let y = 100; y < WORLD_HEIGHT; y += 190) {
        drawTree(x + ((y * 7) % 40), y);
      }
    }

    ctx.fillStyle = "#477f91";
    ctx.beginPath();
    ctx.ellipse(1770, 360, 210, 120, -0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const house of houses) {
      ctx.fillStyle = "#66533a";
      ctx.fillRect(house.x, house.y, house.w, house.h);
      ctx.fillStyle = "#8b7650";
      ctx.fillRect(house.x + 8, house.y + 8, house.w - 16, house.h - 16);
    }

    for (const [x, y] of [[560, 190], [760, 180], [580, 560]]) {
      ctx.fillStyle = "#c4ad7b";
      ctx.fillRect(x, y, 115, 90);
      ctx.fillStyle = "#754a36";
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 8);
      ctx.lineTo(x + 56, y - 48);
      ctx.lineTo(x + 128, y + 8);
      ctx.fill();
      ctx.fillStyle = "#3b3028";
      ctx.fillRect(x + 45, y + 45, 25, 45);
    }
  }

  function drawActor(x, y, color, label) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillRect(x - 9, y - 14, 18, 25);
    ctx.fillStyle = "#e9c79a";
    ctx.fillRect(x - 7, y - 25, 14, 13);
    ctx.fillStyle = "#352b23";
    ctx.fillRect(x - 7, y - 29, 14, 5);
    ctx.fillStyle = "#f4e7c5";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - 36);
  }

  function draw() {
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    drawWorld();
    drawActor(guardian.x, guardian.y, "#d1a54d", "Guardião");
    drawActor(slime.x, slime.y, "#6bc76b", "Slime Verde");
    drawActor(player.x, player.y, "#668ac6", "Viajante");

    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.targetX, player.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function frame(timestamp) {
    const delta = Math.min((timestamp - lastFrame) / 1000, 0.04) || 0;
    lastFrame = timestamp;
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 2) {
      const step = Math.min(distance, 190 * delta);
      player.x += (dx / distance) * step;
      player.y += (dy / distance) * step;
    }

    camera.x = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, player.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, player.y - canvas.height / 2));
    coords.textContent = `X ${Math.round(player.x)} · Y ${Math.round(player.y)}`;
    draw();
    requestAnimationFrame(frame);
  }

  function pointerToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width + camera.x,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height + camera.y
    };
  }

  canvas.addEventListener("click", (event) => {
    const point = pointerToWorld(event);

    if (Math.hypot(point.x - guardian.x, point.y - guardian.y) < 42) {
      notice.textContent = "Guardião: Que a luz guie sua jornada!";
      return;
    }
    if (Math.hypot(point.x - slime.x, point.y - slime.y) < 45) {
      notice.textContent = "Slime Verde: combate será implementado em breve.";
      return;
    }

    player.targetX = Math.max(30, Math.min(WORLD_WIDTH - 30, point.x));
    player.targetY = Math.max(30, Math.min(WORLD_HEIGHT - 30, point.y));
    notice.textContent = "Caminhando até o destino...";
  });

  document.querySelector("#center").addEventListener("click", () => {
    player.targetX = player.x;
    player.targetY = player.y;
    notice.textContent = "Personagem centralizado.";
  });

  document.querySelector("#help").addEventListener("click", () => {
    notice.textContent = "Clique no terreno para caminhar. Clique no Guardião ou no Slime para interagir.";
  });

  requestAnimationFrame(frame);
})();
