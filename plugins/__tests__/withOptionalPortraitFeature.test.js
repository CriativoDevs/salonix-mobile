const { addOptionalPortraitFeature } = require('../withOptionalPortraitFeature');

const FEATURE = 'android.hardware.screen.portrait';

describe('addOptionalPortraitFeature (Google Play: screen.portrait não pode ser obrigatório)', () => {
  it('adiciona uses-feature screen.portrait com required=false quando não existe', () => {
    const manifest = { $: {}, application: [{}] };

    addOptionalPortraitFeature(manifest);

    expect(manifest['uses-feature']).toEqual([
      { $: { 'android:name': FEATURE, 'android:required': 'false' } },
    ]);
  });

  it('mantém os uses-feature existentes', () => {
    const manifest = {
      'uses-feature': [{ $: { 'android:name': 'android.hardware.camera', 'android:required': 'false' } }],
    };

    addOptionalPortraitFeature(manifest);

    expect(manifest['uses-feature']).toHaveLength(2);
    expect(manifest['uses-feature'][0].$['android:name']).toBe('android.hardware.camera');
  });

  it('muda para required=false se a feature já estiver declarada como obrigatória', () => {
    const manifest = {
      'uses-feature': [{ $: { 'android:name': FEATURE, 'android:required': 'true' } }],
    };

    addOptionalPortraitFeature(manifest);

    expect(manifest['uses-feature']).toEqual([
      { $: { 'android:name': FEATURE, 'android:required': 'false' } },
    ]);
  });

  it('é idempotente (não duplica ao rodar duas vezes)', () => {
    const manifest = {};

    addOptionalPortraitFeature(manifest);
    addOptionalPortraitFeature(manifest);

    expect(manifest['uses-feature']).toHaveLength(1);
  });
});
