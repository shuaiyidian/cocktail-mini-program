export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/cocktail-list/index',
    'pages/cocktail-detail/index',
    'pages/custom/index',
    'pages/user/index',
    'pages/member/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1a1a2e',
    navigationBarTitleText: '鸡尾酒调参',
    navigationBarTextStyle: 'white',
    backgroundColor: '#1a1a2e'
  },
  tabBar: {
    color: '#888',
    selectedColor: '#e94560',
    backgroundColor: '#1a1a2e',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '调参'
      },
      {
        pagePath: 'pages/cocktail-list/index',
        text: '酒单'
      },
      {
        pagePath: 'pages/custom/index',
        text: '特调'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的'
      }
    ]
  }
})
