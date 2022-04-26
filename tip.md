# 1.创建-运行-调试

```bash
npx tsdx create fuyan-component
cd fuyan-component
npm run start
cd example
npm i
npm run start
```

/src/index.tsx 中导出的组件可以在 /example/index.tsx 中进行引用
import \* as FuYan from '../.';

# 2.声明图片文件，防止引用报错

> /tsconfig.json 文件的 include 字段包含的文件下新建 \*.d.ts 文件

1. 在 /src 下新建 declare.d.ts

2. 输入如下代码
   ```typescript
   // 声明图片
   declare module '*.svg';
   declare module '*.png';
   declare module '*.jpg';
   declare module '*.jpeg';
   declare module '*.gif';
   declare module '*.bmp';
   declare module '*.tiff';
   ```

# 3.打包图片和 css 配置

1. 下载依赖

   ```bash
   npm i -D postcss rollup-plugin-postcss @rollup/plugin-image
   ```

   postcss rollup-plugin-postcss 打包 css

   @rollup/plugin-image 打包图片

2. 新建 /tsdx.config.js

```javascript
const postcss = require('rollup-plugin-postcss');
const images = require('@rollup/plugin-image');

module.exports = {
  rollup(config, options) {
    // 官方案例，此时不会自动注入 css 文件。需要开发者手动引入，css文件在打包的dist下，类似 antd 需要手动引入css。
    // config.plugins.push(
    //   postcss({
    //     inject: false,
    //     extract: !!options.writeMeta,
    //   }),
    // );

    // postcss，当extract为true时，无论inject为什么值都不会自动注入css。此处不建议按照tsdx官方配置。直接不传参即可
    // 虽然官方案例使用的是直接在数组push来添加 postcss 插件，但是添加 image 插件时会报错。此处使用给值的方式添加
    config.plugins = [
      // postcss({
      //   inject: false,
      //   extract: !!options.writeMeta,
      // }),
      postcss(),
      images(),
      ...config.plugins,
    ];
    return config;
  },
};
```
