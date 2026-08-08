export default function (api) {
  /* Cache the configuration based on NODE_ENV */
  api.cache(true);

  let presets;

  if (process.env.NODE_ENV === 'es') {
    presets = [
      [
        '@babel/preset-env',
        {
          modules: false,
        },
      ],
    ];
  } else if (process.env.NODE_ENV === 'umd') {
    presets = [
      [
        '@babel/preset-env',
      ],
    ];
  }

  return {
    plugins: ['@babel/plugin-transform-object-assign'],
    presets,
  };
}
