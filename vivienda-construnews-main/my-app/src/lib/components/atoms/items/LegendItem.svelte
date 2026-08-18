<script lang="ts">
    let {
        label,
        color = '#000',
        type = 'square',
        variant = 'solid',
        size = 'md',
        opacity = 1
    } = $props<{
        label: string
        color: string,
        type ?: 'square' | 'circle' | 'line' | 'rect',
        variant ?: 'solid' | 'outline' | 'dashed',
        size ?: 'sm' | 'md' | 'lg',
        opacity ?: number,
    }>();

    const sizeMap = {
        sm: '8px',
        md: '12px',
        lg: '16px'
    } as any;

    const cssSize = '12px';

</script>

<div class="legend-item">
    <div
        class="symbol"
        class:is-circle = {type === 'circle'}
        class:is-line = {type === 'line'}
        class:is-rect = {type === 'rect'}

        style:--color = {color}
        style:--size = {cssSize} 
        style:--opacity = {opacity}
        style:--border-style = {variant === 'dashed' ? 'dashed' : 'solid'}
        
        style:--bg-color = {variant === 'outline' ? `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)` : color}
        style:--border-width={variant === 'outline' ? '2px' : (type === 'line' ? '2px' : '0px')}
        >
    </div>
    <span class="label">{label}</span>
</div>

<style>
    .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 2px;
        font-size: 0.8rem;
        color: #333;
    }

    .symbol {
        width: var(--size); 
        height: var(--size);
        background-color: var(--bg-color);
        border-color: var(--color);
        border-width: var(--border-width);
        border-style: var(--border-style); 
        box-sizing: border-box;
    }

    .is-circle {
        border-radius: 50%;
    }

    .is-rect {
        width: calc(var(--size) * 1.6);
    }

    .is-line {
        height: 0;
        background-color: transparent;
        border-top-width: 2px;
        border-top-style: var(--border-style);
        width: calc(var(--size) * 2);
        border-color: var(--color);
        opacity: var(--opacity);
    }

    .label {
        font-size: .9rem;
    }

    @media (max-width:768px) {
        .label {
            font-size: .9rem;
        }
    }
</style>
