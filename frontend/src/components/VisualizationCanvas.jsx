import React, { useRef, useEffect, useState } from 'react';

function drawArrow(ctx, x, y, dx, dy){
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x+dx, y+dy);
  ctx.stroke();
  const angle = Math.atan2(dy, dx);
  const size = 6;
  ctx.beginPath();
  ctx.moveTo(x+dx, y+dy);
  ctx.lineTo(x+dx - size*Math.cos(angle-Math.PI/6), y+dy - size*Math.sin(angle-Math.PI/6));
  ctx.lineTo(x+dx - size*Math.cos(angle+Math.PI/6), y+dy - size*Math.sin(angle+Math.PI/6));
  ctx.closePath();
  ctx.fill();
}

export default function VisualizationCanvas({ spec }){
  const canvasRef = useRef();
  const rafRef = useRef();
  const startRef = useRef(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    function resize(){
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function render(t){
      if(!spec){ ctx.clearRect(0,0,canvas.width,canvas.height); return; }
      if(!startRef.current) startRef.current = t;
      const elapsed = Math.max(0, t - startRef.current);
      const duration = spec.duration || 4000;
      ctx.clearRect(0,0,canvas.width,canvas.height);

      (spec.layers || []).forEach(layer => {
        const props = { ...(layer.props || {}) };
        (layer.animations || []).forEach(anim => {
          const s = anim.start || 0;
          const e = anim.end || duration;
          const localT = Math.min(Math.max(elapsed, s), e);
          const p = (localT - s) / Math.max(1, (e - s));
          if(anim.property === 'x'){
            props.x = (anim.from ?? props.x) + ((anim.to ?? props.x) - (anim.from ?? props.x)) * p;
          } else if(anim.property === 'y'){
            props.y = (anim.from ?? props.y) + ((anim.to ?? props.y) - (anim.from ?? props.y)) * p;
          } else if(anim.property === 'orbit'){
            const period = anim.duration || duration;
            const angle = 2 * Math.PI * ((elapsed % period) / period);
            props.x = (anim.centerX ?? props.x) + (anim.radius ?? 50) * Math.cos(angle);
            props.y = (anim.centerY ?? props.y) + (anim.radius ?? 50) * Math.sin(angle);
          }
        });

        ctx.fillStyle = props.fill || '#3498db';
        ctx.strokeStyle = props.stroke || '#222';
        ctx.lineWidth = 1.5;
        if(layer.type === 'circle'){
          ctx.beginPath();
          ctx.arc(props.x, props.y, props.r || 10, 0, Math.PI*2);
          ctx.fill();
        } else if(layer.type === 'rect'){
          const w = props.w || props.width || 40;
          const h = props.h || props.height || 20;
          ctx.fillRect(props.x - w/2, props.y - h/2, w, h);
        } else if(layer.type === 'arrow'){
          ctx.strokeStyle = '#111';
          ctx.fillStyle = '#111';
          drawArrow(ctx, props.x, props.y, props.dx || 30, props.dy || 0);
        }
      });

      if(playing) rafRef.current = requestAnimationFrame(render);
    }

    if(playing) rafRef.current = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      if(rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [spec, playing]);

  useEffect(()=> {
    // reset animation when spec changes
    startRef.current = null;
  }, [spec]);

  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      <div style={{height:'70vh'}}>
        <canvas ref={canvasRef} style={{width:'100%', height:'100%', borderRadius:8}}/>
      </div>
      <div style={{display:'flex', gap:8}}>
        <button onClick={()=> setPlaying(p=>!p)}>{playing ? 'Pause' : 'Play'}</button>
        <div className="small-muted">{spec ? `Visualization: ${spec.id} — duration: ${spec.duration}ms` : 'No visualization selected'}</div>
      </div>
    </div>
  );
}
