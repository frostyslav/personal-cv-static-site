/**
 * SVGO configuration — optimizes SVGs during build.
 * Used by: npx svgo dist/favicon.svg
 */
module.exports = {
  multipass: true,
  plugins: [
    'preset-default',
    'removeDimensions',
    {
      name: 'removeAttrs',
      params: {
        attrs: ['class', 'data-name'],
      },
    },
  ],
};
