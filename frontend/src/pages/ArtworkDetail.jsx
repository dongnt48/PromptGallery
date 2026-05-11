import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Copy, Share2 } from 'lucide-react';

const ArtworkDetail = () => {
  const { id } = useParams();

  // Mock details
  const artwork = {
    id,
    imageUrl: `https://picsum.photos/id/${10 + parseInt(id || 0)}/1200/800`,
    prompt: 'A highly detailed cinematic shot of a futuristic city with glowing neon lights, flying cars, and towering skyscrapers, cyberpunk aesthetic, 8k resolution, photorealistic.',
    negativePrompt: 'blurry, low quality, distorted',
    model: 'Midjourney v6',
    seed: '9482713',
    sampler: 'DPM++ 2M Karras',
    cfgScale: 7,
    steps: 30,
    author: 'AI Artist',
  };

  return (
    <div className="page-container">
      <Link to="/" className="nav-link" style={{ marginBottom: '24px', display: 'inline-flex' }}>
        <ArrowLeft size={20} /> Back to Gallery
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        <div style={{ borderRadius: 'var(--rounded-3xl)', overflow: 'hidden', backgroundColor: 'var(--surface-container)' }}>
          <img src={artwork.imageUrl} alt="Artwork" style={{ width: '100%', display: 'block' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h1 className="headline-md" style={{ marginBottom: '8px' }}>Artwork #{id}</h1>
            <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>Created by {artwork.author}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-primary" style={{ flex: 1 }}><Heart size={18} style={{ marginRight: '8px' }} /> Save</button>
            <button className="btn-icon" style={{ height: '48px', width: '48px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={20} /></button>
          </div>

          <div style={{ padding: '24px', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--rounded-2xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span className="label-sm">Prompt</span>
              <button className="btn-icon" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Copy size={14} /> Copy</button>
            </div>
            <p className="body-md" style={{ padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: 'var(--rounded-xl)' }}>
              {artwork.prompt}
            </p>
          </div>

          <div style={{ padding: '24px', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--rounded-2xl)' }}>
            <span className="label-sm" style={{ marginBottom: '12px', display: 'block' }}>Negative Prompt</span>
            <p className="body-md" style={{ padding: '16px', backgroundColor: 'var(--surface-container)', borderRadius: 'var(--rounded-xl)' }}>
              {artwork.negativePrompt}
            </p>
          </div>

          <div style={{ padding: '24px', backgroundColor: 'var(--surface-container-low)', borderRadius: 'var(--rounded-2xl)' }}>
            <span className="label-sm" style={{ marginBottom: '16px', display: 'block' }}>Generation Data</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Model</span>
                <p className="body-md">{artwork.model}</p>
              </div>
              <div>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Seed</span>
                <p className="body-md">{artwork.seed}</p>
              </div>
              <div>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Sampler</span>
                <p className="body-md">{artwork.sampler}</p>
              </div>
              <div>
                <span className="label-sm" style={{ color: 'var(--on-surface-variant)' }}>Steps / CFG</span>
                <p className="body-md">{artwork.steps} / {artwork.cfgScale}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkDetail;
