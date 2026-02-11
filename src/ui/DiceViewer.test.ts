// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { DiceViewer } from './DiceViewer';

// Stub WebGL2 for Three.js renderers (jsdom has no WebGL)
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = (() => {
    const stringParams = new Set([0x1F02, 0x8B8C, 0x1F01, 0x1F00]);

    const ctx: Record<string, unknown> = {
      canvas: document.createElement('canvas'),
      drawingBufferWidth: 72,
      drawingBufferHeight: 72,
      drawingBufferColorSpace: 'srgb',

      VERSION: 0x1F02,
      SHADING_LANGUAGE_VERSION: 0x8B8C,
      RENDERER: 0x1F01,
      VENDOR: 0x1F00,
      MAX_TEXTURE_SIZE: 0x0D33,
      MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
      MAX_TEXTURE_IMAGE_UNITS: 0x8872,
      MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
      MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
      MAX_VERTEX_ATTRIBS: 0x8869,
      MAX_VARYING_VECTORS: 0x8DFC,
      MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
      MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
      MAX_RENDERBUFFER_SIZE: 0x84E8,
      MAX_VIEWPORT_DIMS: 0x0D3A,
      MAX_SAMPLES: 0x8D57,
      MAX_3D_TEXTURE_SIZE: 0x8073,
      MAX_ARRAY_TEXTURE_LAYERS: 0x88FF,
      MAX_DRAW_BUFFERS: 0x8824,
      MAX_COLOR_ATTACHMENTS: 0x8CDF,
      MAX_UNIFORM_BUFFER_BINDINGS: 0x8A2F,
      MAX_UNIFORM_BLOCK_SIZE: 0x8A30,
      MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: 0x8C8B,
      FRAMEBUFFER_COMPLETE: 36053,
      FLOAT: 0x1406,
      UNSIGNED_BYTE: 0x1401,
      UNSIGNED_SHORT: 0x1403,
      UNSIGNED_INT: 0x1405,
      BYTE: 0x1400,
      SHORT: 0x1402,
      INT: 0x1404,
      HALF_FLOAT: 0x140B,
      RGBA: 0x1908,
      RGB: 0x1907,
      RGBA8: 0x8058,
      SRGB8_ALPHA8: 0x8C43,
      DEPTH_COMPONENT16: 0x81A5,
      DEPTH_COMPONENT24: 0x81A6,
      DEPTH_COMPONENT32F: 0x8CAC,
      DEPTH24_STENCIL8: 0x88F0,
      DEPTH32F_STENCIL8: 0x8CAD,
      DEPTH_COMPONENT: 0x1902,
      DEPTH_STENCIL: 0x84F9,
      STENCIL_INDEX8: 0x8D48,
      COLOR_ATTACHMENT0: 0x8CE0,
      DEPTH_ATTACHMENT: 0x8D00,
      STENCIL_ATTACHMENT: 0x8D20,
      DEPTH_STENCIL_ATTACHMENT: 0x821A,
      FRAMEBUFFER: 0x8D40,
      RENDERBUFFER: 0x8D41,
      TEXTURE_2D: 0x0DE1,
      TEXTURE_CUBE_MAP: 0x8513,
      TEXTURE_3D: 0x806F,
      TEXTURE_2D_ARRAY: 0x8C1A,
      TEXTURE_CUBE_MAP_POSITIVE_X: 0x8515,
      TEXTURE0: 0x84C0,
      ARRAY_BUFFER: 0x8892,
      ELEMENT_ARRAY_BUFFER: 0x8893,
      UNIFORM_BUFFER: 0x8A11,
      STATIC_DRAW: 0x88E4,
      DYNAMIC_DRAW: 0x88E8,
      STREAM_DRAW: 0x88E0,
      TRIANGLES: 0x0004,
      TRIANGLE_STRIP: 0x0005,
      TRIANGLE_FAN: 0x0006,
      LINES: 0x0001,
      LINE_STRIP: 0x0003,
      POINTS: 0x0000,
      VERTEX_SHADER: 0x8B31,
      FRAGMENT_SHADER: 0x8B30,
      COMPILE_STATUS: 0x8B81,
      LINK_STATUS: 0x8B82,
      ACTIVE_UNIFORMS: 0x8B86,
      ACTIVE_ATTRIBUTES: 0x8B89,
      TEXTURE_MIN_FILTER: 0x2801,
      TEXTURE_MAG_FILTER: 0x2800,
      TEXTURE_WRAP_S: 0x2802,
      TEXTURE_WRAP_T: 0x2803,
      NEAREST: 0x2600,
      LINEAR: 0x2601,
      LINEAR_MIPMAP_LINEAR: 0x2703,
      NEAREST_MIPMAP_NEAREST: 0x2700,
      CLAMP_TO_EDGE: 0x812F,
      REPEAT: 0x2901,
      MIRRORED_REPEAT: 0x8370,
      BLEND: 0x0BE2,
      DEPTH_TEST: 0x0B71,
      STENCIL_TEST: 0x0B90,
      CULL_FACE: 0x0B44,
      SCISSOR_TEST: 0x0C11,
      POLYGON_OFFSET_FILL: 0x8037,
      SAMPLE_ALPHA_TO_COVERAGE: 0x809E,
      FUNC_ADD: 0x8006,
      ONE: 1,
      ZERO: 0,
      SRC_ALPHA: 0x0302,
      ONE_MINUS_SRC_ALPHA: 0x0303,
      FRONT: 0x0404,
      BACK: 0x0405,
      CW: 0x0900,
      CCW: 0x0901,
      LESS: 0x0201,
      LEQUAL: 0x0203,
      ALWAYS: 0x0207,
      NEVER: 0x0200,
      EQUAL: 0x0202,
      KEEP: 0x1E00,
      REPLACE: 0x1E01,
      INCR: 0x1E02,
      DECR: 0x1E03,
      UNPACK_ALIGNMENT: 0x0CF5,
      UNPACK_FLIP_Y_WEBGL: 0x9240,
      UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
      UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
      NONE: 0,
      COLOR_BUFFER_BIT: 0x4000,
      DEPTH_BUFFER_BIT: 0x0100,
      STENCIL_BUFFER_BIT: 0x0400,
      TEXTURE_COMPARE_MODE: 0x884C,
      TEXTURE_COMPARE_FUNC: 0x884D,
      COMPARE_REF_TO_TEXTURE: 0x884E,
      RED: 0x1903,
      R8: 0x8229,
      RG: 0x8227,
      RG8: 0x822B,
      RGBA16F: 0x881A,
      RGBA32F: 0x8814,
      R16F: 0x822D,
      R32F: 0x822E,
      RG16F: 0x822F,
      RG32F: 0x8230,
      R11F_G11F_B10F: 0x8C3A,
      RGB16F: 0x881B,
      RGB32F: 0x8815,
      TRANSFORM_FEEDBACK: 0x8E22,
      RASTERIZER_DISCARD: 0x8C89,
      SEPARATE_ATTRIBS: 0x8C8D,
      INTERLEAVED_ATTRIBS: 0x8C8C,
      DRAW_FRAMEBUFFER: 0x8CA9,
      READ_FRAMEBUFFER: 0x8CA8,
      SYNC_GPU_COMMANDS_COMPLETE: 0x9117,
      ALREADY_SIGNALED: 0x911A,
      CONDITION_SATISFIED: 0x911C,
      WAIT_FAILED: 0x911D,
    };

    const getParameter = (param: number): unknown => {
      if (stringParams.has(param)) {
        if (param === 0x1F02) return 'WebGL 2.0';
        if (param === 0x8B8C) return 'WebGL GLSL ES 3.00';
        if (param === 0x1F01) return 'WebGL Stub';
        if (param === 0x1F00) return 'WebGL Stub Vendor';
      }
      if (param === 0x0D3A) return new Int32Array([16384, 16384]);
      if (param === 0x0D33) return 16384;
      if (param === 0x851C) return 8192;
      if (param === 0x8872) return 16;
      if (param === 0x8B4C) return 16;
      if (param === 0x8B4D) return 32;
      if (param === 0x8869) return 16;
      if (param === 0x8DFC) return 30;
      if (param === 0x8DFB) return 4096;
      if (param === 0x8DFD) return 1024;
      if (param === 0x84E8) return 16384;
      if (param === 0x8D57) return 4;
      if (param === 0x8073) return 2048;
      if (param === 0x88FF) return 2048;
      if (param === 0x8824) return 8;
      if (param === 0x8CDF) return 8;
      if (param === 0x8A2F) return 72;
      if (param === 0x8A30) return 65536;
      if (param === 0x8C8B) return 4;
      return 0;
    };

    ctx.getParameter = getParameter;
    ctx.getExtension = () => null;
    ctx.getShaderPrecisionFormat = () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
    ctx.getSupportedExtensions = () => [];
    ctx.getContextAttributes = () => ({});
    ctx.isContextLost = () => false;
    ctx.checkFramebufferStatus = () => 36053;

    return new Proxy(ctx, {
      get(target, prop) {
        if (prop in target) return target[prop as string];
        return () => {};
      },
    });
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe('DiceViewer', () => {
  it('creates an overlay div that is hidden by default', () => {
    const root = document.createElement('div');
    new DiceViewer(root);
    const overlay = root.querySelector('.dice-viewer-overlay') as HTMLElement;
    expect(overlay).not.toBeNull();
    expect(overlay.style.display).toBe('none');
  });

  it('show() displays the overlay with the requested die type', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.show('d6');
    const overlay = root.querySelector('.dice-viewer-overlay') as HTMLElement;
    expect(overlay.style.display).toBe('flex');
  });

  it('show() updates the label to the die name', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.show('d20');
    const label = root.querySelector('.dice-viewer-label') as HTMLElement;
    expect(label.textContent).toBe('D20');
  });

  it('hide() hides the overlay', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.show('d6');
    viewer.hide();
    const overlay = root.querySelector('.dice-viewer-overlay') as HTMLElement;
    expect(overlay.style.display).toBe('none');
  });

  it('isOpen() returns true when visible', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    expect(viewer.isOpen()).toBe(false);
    viewer.show('d6');
    expect(viewer.isOpen()).toBe(true);
    viewer.hide();
    expect(viewer.isOpen()).toBe(false);
  });

  it('show() with a different type switches the die without closing', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.show('d6');
    viewer.show('d20');
    expect(viewer.isOpen()).toBe(true);
    expect(viewer.getCurrentType()).toBe('d20');
    const label = root.querySelector('.dice-viewer-label') as HTMLElement;
    expect(label.textContent).toBe('D20');
  });

  describe('keyboard handling', () => {
    it('handleKey opens the viewer for keys 1-7', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      viewer.handleKey('1');
      expect(viewer.isOpen()).toBe(true);
      expect(viewer.getCurrentType()).toBe('d4');
    });

    it('handleKey maps keys to correct dice types', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      const expected: [string, string][] = [
        ['1', 'd4'], ['2', 'd6'], ['3', 'd8'],
        ['4', 'd10'], ['5', 'd12'], ['6', 'd20'], ['7', 'd100'],
      ];
      for (const [key, type] of expected) {
        viewer.handleKey(key);
        expect(viewer.getCurrentType()).toBe(type);
      }
    });

    it('handleKey with same key toggles off', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      viewer.handleKey('2');
      expect(viewer.isOpen()).toBe(true);
      viewer.handleKey('2');
      expect(viewer.isOpen()).toBe(false);
    });

    it('handleKey with Escape closes the viewer', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      viewer.handleKey('3');
      expect(viewer.isOpen()).toBe(true);
      viewer.handleKey('Escape');
      expect(viewer.isOpen()).toBe(false);
    });

    it('handleKey with different key switches the die', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      viewer.handleKey('1');
      viewer.handleKey('6');
      expect(viewer.isOpen()).toBe(true);
      expect(viewer.getCurrentType()).toBe('d20');
    });

    it('handleKey ignores unrecognized keys', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      viewer.handleKey('a');
      expect(viewer.isOpen()).toBe(false);
    });

    it('Escape when closed is a no-op', () => {
      const root = document.createElement('div');
      const viewer = new DiceViewer(root);
      viewer.handleKey('Escape');
      expect(viewer.isOpen()).toBe(false);
    });
  });

  it('dispose() removes the overlay from the DOM', () => {
    const root = document.createElement('div');
    const viewer = new DiceViewer(root);
    viewer.dispose();
    expect(root.querySelector('.dice-viewer-overlay')).toBeNull();
  });
});
