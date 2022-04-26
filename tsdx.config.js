const postcss = require('rollup-plugin-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const images = require('@rollup/plugin-image');

module.exports = {
  rollup(config, options) {
    // ps: 此时如果继续push images打包图片，会报错。
    // config.plugins.push(
    //   postcss({
    //     plugins: [
    //       autoprefixer(),
    //       cssnano({
    //         preset: 'default',
    //       }),
    //     ],
    //     inject: false,
    //     // only write out CSS for the first bundle (avoids pointless extra files):
    //     extract: !!options.writeMeta,
    //   })
    // );

    config.plugins = [
      postcss({
        plugins: [
          autoprefixer(),
          cssnano({
            preset: 'default',
          }),
        ],
        // 打包完css之后注入到<head>标签的<style>标签中。 false不注入，true注入。 如果 extract 为true，那么此值无论设不设置都为false。
        // inject: false,
        // only write out CSS for the first bundle (avoids pointless extra files):
        // extract: !!options.writeMeta,
      }),
      images(),
      ...config.plugins,
    ];
    return config;
  },
};
