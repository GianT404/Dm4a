// module.exports = function(api) {
//   api.cache(true);
//   return {
//     presets: ['babel-preset-expo'], // or other presets
//     plugins: [
//       // Ensure plugins are listed as strings in the array
//       'expo-router/babel', 
//       'react-native-reanimated/plugin',
//     ],
//   };
// };

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};