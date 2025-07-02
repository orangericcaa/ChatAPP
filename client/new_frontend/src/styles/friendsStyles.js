// 好友页面共享样式 - 桌面端适配
export const friendsStyles = {
  containerStyle: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#fce4ec',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minWidth: '1200px', // 桌面端最小宽度
    width: '100vw', // 占据整个视口宽度
    boxSizing: 'border-box', // 盒模型
  },

  headerStyle: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px', // 增加内边距
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f8bbd9',
    boxShadow: '0 2px 4px rgba(233, 30, 99, 0.1)',
    minHeight: '70px', // 固定头部高度
    flexShrink: 0, // 防止头部压缩
  },

  logoStyle: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e91e63',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '18px',
    fontWeight: 'bold',
    marginRight: '16px', // 调整间距
    flexShrink: 0, // 防止logo变形
  },

  contactInfoStyle: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
  },

  statusDotStyle: (isOnline) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isOnline ? '#4caf50' : '#9e9e9e',
    marginLeft: '8px',
  }),

  mainContentStyle: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    // 左右分栏布局已在主内容区实现
  },
};
