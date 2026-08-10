module.exports = {
  presets: [
    [
      'babel-preset-taro',
      {
        framework: 'react',
        ts: true,
        useBuiltIns: 'usage',
        targets: { ios: '12', android: '5' }
      }
    ]
  ]
}
