document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const currentZoneDisplay = document.getElementById('current-zone');
    const feedback = document.getElementById('feedback');
    const scoreDisplay = document.getElementById('score-display');
    const feedbackText = document.getElementById('feedback-text');
    const resetButton = document.getElementById('resetButton');

    // 設置初始狀態
    let isDrawing = false;
    let currentStroke = [];
    let strokes = [];
    let currentZone = 1;
    let score = null;
    let mousePosition = { x: 50, y: 50 };
    
    // 設置畫布大小
    function setupCanvas() {
        const container = canvas.parentElement;
        const size = Math.min(container.offsetWidth - 32, window.innerHeight - 200);
        canvas.width = size;
        canvas.height = size;
    }

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    // 繪製接種環
    function drawLoop(x, y) {
        const scale = canvas.width / 400;
        
        ctx.save();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2 * scale;
        
        // 環
        ctx.beginPath();
        ctx.arc(x, y, 5 * scale, 0, 2 * Math.PI);
        ctx.stroke();
        
        // 手柄
        ctx.beginPath();
        ctx.moveTo(x, y + 5 * scale);
        ctx.lineTo(x, y + 45 * scale);
        ctx.stroke();
        
        // 底部
        ctx.lineWidth = 3 * scale;
        ctx.beginPath();
        ctx.moveTo(x, y + 45 * scale);
        ctx.lineTo(x, y + 55 * scale);
        ctx.stroke();
        ctx.restore();
    }

    // 主要繪圖函數
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const scale = canvas.width / 400;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 180 * scale;
        
        // 繪製培養皿
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        
        // 繪製已完成的線條
        strokes.forEach((stroke, index) => {
            ctx.beginPath();
            ctx.strokeStyle = ['#FF0000', '#00FF00', '#FFA500', '#0000FF'][index];
            ctx.lineWidth = 3 * scale;
            ctx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                ctx.lineTo(stroke[i].x, stroke[i].y);
            }
            ctx.stroke();
        });
        
        // 繪製當前線條
        if (isDrawing && currentStroke.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = ['#FF0000', '#00FF00', '#FFA500', '#0000FF'][currentZone - 1];
            ctx.lineWidth = 3 * scale;
            ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
            for (let i = 1; i < currentStroke.length; i++) {
                ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
            }
            ctx.lineTo(mousePosition.x, mousePosition.y);
            ctx.stroke();
        }
        
        drawLoop(mousePosition.x, mousePosition.y);
        requestAnimationFrame(draw);
    }

    // 計算角度
    function calculateStrokeAngle(stroke) {
        if (!stroke || stroke.length < 2) return 0;
        const start = stroke[0];
        const end = stroke[stroke.length - 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    // 檢查重疊
    function checkOverlap(currentStroke, previousStroke) {
        if (!currentStroke || !previousStroke) return false;
        const prevMinX = Math.min(...previousStroke.map(p => p.x));
        const prevMaxX = Math.max(...previousStroke.map(p => p.x));
        const prevMinY = Math.min(...previousStroke.map(p => p.y));
        const prevMaxY = Math.max(...previousStroke.map(p => p.y));
        
        const firstPoint = currentStroke[0];
        return firstPoint.x >= prevMinX && firstPoint.x <= prevMaxX &&
               firstPoint.y >= prevMinY && firstPoint.y <= prevMaxY;
    }

    // 評分系統
    function evaluateStrokes() {
        let totalScore = 100;
        let feedbackText = [];

        if (strokes[0]) {
            const firstZoneAngle = calculateStrokeAngle(strokes[0]);
            if (Math.abs(firstZoneAngle - 45) > 30) {
                totalScore -= 10;
                feedbackText.push('第一區建議維持約45度角劃線');
            }
        }

        if (strokes[1]) {
            const secondZoneAngle = calculateStrokeAngle(strokes[1]);
            const hasOverlap = checkOverlap(strokes[1], strokes[0]);
            if (Math.abs(secondZoneAngle) > 25) {
                totalScore -= 8;
                feedbackText.push('第二區建議保持接近水平劃線');
            }
            if (!hasOverlap) {
                totalScore -= 8;
                feedbackText.push('第二區建議與第一區有些許重疊');
            }
        }

        if (strokes[2]) {
            const thirdZoneAngle = calculateStrokeAngle(strokes[2]);
            const hasOverlap = checkOverlap(strokes[2], strokes[1]);
            if (Math.abs(thirdZoneAngle + 45) > 30) {
                totalScore -= 8;
                feedbackText.push('第三區建議維持約-45度角劃線');
            }
            if (!hasOverlap) {
                totalScore -= 8;
                feedbackText.push('第三區建議與第二區有些許重疊');
            }
        }

        if (strokes[3]) {
            const fourthZoneAngle = calculateStrokeAngle(strokes[3]);
            const hasOverlap = checkOverlap(strokes[3], strokes[2]);
            if (Math.abs(fourthZoneAngle + 45) > 30) {
                totalScore -= 8;
                feedbackText.push('第四區建議維持約-45度角劃線');
            }
            if (!hasOverlap) {
                totalScore -= 8;
                feedbackText.push('第四區建議與第三區有些許重疊');
            }
        }

        const finalScore = Math.max(0, totalScore);
        let encouragement = '';
        if (finalScore > 90) {
            encouragement = '太強了，這根本專業等級！';
        } else if (finalScore >= 80) {
            encouragement = '哇賽，接近完美了！';
        } else if (finalScore >= 60) {
            encouragement = '不錯喔，但可以再更好！';
        } else {
            encouragement = '加油，請繼續練習！';
        }

        scoreDisplay.textContent = `得分：${finalScore} - ${encouragement}`;
        feedbackText.textContent = `評語：${feedbackText.length > 0 ? feedbackText.join('、') : '做得很好！'}`;
        feedback.classList.add('feedback-visible');
    }

    // 事件處理函數
    function getCanvasCoordinates(event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (event.touches) {
            return {
                x: (event.touches[0].clientX - rect.left) * scaleX,
                y: (event.touches[0].clientY - rect.top) * scaleY
            };
        } else {
            return {
                x: (event.clientX - rect.left) * scaleX,
                y: (event.clientY - rect.top) * scaleY
            };
        }
    }

    function startDrawing(e) {
        e.preventDefault();
        if (currentZone > 4 || score !== null) return;
        
        const coords = getCanvasCoordinates(e);
        isDrawing = true;
        currentStroke = [coords];
        mousePosition = coords;
    }

    function handleMove(e) {
        e.preventDefault();
        const coords = getCanvasCoordinates(e);
        mousePosition = coords;
        
        if (isDrawing) {
            currentStroke.push(coords);
        }
    }

    function endDrawing(e) {
        if (e) e.preventDefault();
        if (isDrawing) {
            strokes.push(currentStroke);
            currentZone++;
            currentZoneDisplay.textContent = `第 ${currentZone} 區`;
            isDrawing = false;
            
            if (currentZone === 5) {
                evaluateStrokes();
            }
        }
    }

    function resetGame() {
        strokes = [];
        currentStroke = [];
        currentZone = 1;
        score = null;
        mousePosition = { x: 50, y: 50 };
        isDrawing = false;
        currentZoneDisplay.textContent = `第 ${currentZone} 區`;
        feedback.classList.remove('feedback-visible');
    }

    // 事件監聽
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', endDrawing);
    canvas.addEventListener('mouseleave', endDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', handleMove);
    canvas.addEventListener('touchend', endDrawing);
    resetButton.addEventListener('click', resetGame);

    // 開始動畫
    requestAnimationFrame(draw);
});
