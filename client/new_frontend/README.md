# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

// 每一段 prompt 说明后面添加详细注释，解释其功能、页面结构、交互逻辑和注意事项，注释风格为“// 注释内容”。

PROMPT

 
 
我希望你能在pages和components文件夹中帮我写出如我截图所示的页面，使用的是React+Vite+JavaScript，不用TypeScript。因为会把web后期打包成app，所以我希望生成的页面交互性更强，比如说随着页面的拉伸放大可以自由变换这种。然后有些图标，背景图什么的我现在还没有找，你可以先暂时用纯色的色块代替。
第一个是聊天页面Chat_page
为了方便描述我给你标注了一些数字，我会尽量的描述清楚，如果你有不明白的地方一定给我反馈。
位置信息：
1 是我们app的logo，先代替一下。
2 是聊天对象的Id要在这里显示，然后显示当前对象是在线或者离线（） 
3 是好友列表的图标，4是聊天页面的图标，点击后会跳转到响应页面，如果当前已经在该页面就刷新
1-4在一个栏中，然后稍微分割一下，比例按照我传送的图片来。
5 是聊天的内容，当收到对方的消息，消息用彩色的气泡，字体用白色的气泡 6是己方发送消息，气泡是白色的，然后字是彩色的，注意字的颜色要相比气泡要显眼，然后气泡的话，尽量有个气泡尾部指向发信者
7是编辑消息的地方，像这样做一个内投影的白色框就好，然后右下角有一个发送键，摁了发送键就会发送消息，左边三个按钮从上到下的功能分别是：视频通话，发送图片，发送语音，摁视频通话的话会转入Frame_2视频通话页面（之所以尺寸不一样，我希望能以一个固定大小的弹窗这样，能有一个弹出来的感觉），点击发送图片的话，会读随机发一张图片（后端你的，这个不用生成），语音是发送语音消息。
8 是一个按钮，摁一下可以从右侧弹入最近消息列表ChatList_page，大概如另一张图所示(是没有ChatList_page 这个标题的，因为绘图软件这部分去不掉了)。ChatList_page 里是最近的消息，消息最先的放在最前面，9是当前用户的用户名，10是消息的格式，左侧为发消息的人的头像，然后上面是发消息的人的用户名。这个页面和本来的聊天页面是强相关的，聊天关闭，这个也会关闭
11 是视频通话页面，上面的部分是通话人的姓名，下面全屏都是到时候视频通话一连接就会接上视频画面，13是挂断按钮，圆型，然后上面有个小图标还没存先用纯色代替一下，摁了之后就会通话终止，视频通话页面关闭（视频通话页面是独立于聊天页面的）

 
第二个是好友列表 Friends_page，请根据我的提示图
和微信的好友列表是差不多的，顶部和ChatPage.jsx的顶部是一样的，下面是刚才的prompt，1 是我们app的logo，先代替一下。
2 是聊天对象的Id要在这里显示，然后显示当前对象是在线或者离线（） 
3 是好友列表的图标，4是聊天页面的图标，点击后会跳转到响应页面，如果当前已经在该页面就刷新
1-4在一个栏中，然后稍微分割一下，比例按照我传送的图片来。
然后下面的部分，分成左右两栏，占比大概是4：6，然后左边是好友列表，左侧的最上面是一个搜索栏，用于搜索用户，可以搜索用户的任意信息（用户名，账号等），如果可以搜索到结果会在右侧部分显示，如果没搜索到会有一个弹窗报错显示该用户不存在，然后搜索栏下方是好友列表，每一格的左侧是头像，右侧是用户名，样式和风格尽量和那个ChatListPage保持一致吧。右侧是好友信息，那个大的圆的是头像，方框是写个人信息的，包括用户名，账号，和个性签名，然后


第三个是登录页面 LoginCodePage
如图所示，登录邮箱，密码，左边是注册按钮，点击后会跳转到SignUpPage，右面是登录按钮
如果登陆邮箱在数据库中不存在，弹出报错窗口“该用户不存在，请注册”
如果用户名和密码不匹配，弹出报错窗口“密码错误，请重试”
如果用户名或密码匹配，读取该用户的信息，跳转到ChatPage
如果有一栏是空的，就弹出报错窗口显示请输入+那一栏的名字
然后下面有一个跳转的链接（不是按钮的样式，但是字和按钮的一样大，做成蓝色的）是验证码登录，点击会跳转到LoginVcode页面
第四个是验证码登录LoginVcodePage
把上面页面的密码输入换成验证码，然后把注册按钮换成一个 发送验证码按钮（函数功能先暂且不实现，你可以先在适合的地方预留空间然后写一行备注说此处是发送验证码的函数），然后下面的跳转改为跳转到密码登录
第五个是注册界面 SignUpPage
布局和登陆页面是基本一样的，但是表格的数量不同，有邮箱、昵称、密码、确认密码、验证码五项，示例是这样的，但记得更改风格保持和前面的页面一致，然后注册按钮，也是预留出来注释的地方分别弄出注册成功和注册失败的函数，然后又对应的消息窗口
 

我上传了一个picture文件夹用作用户头像，请你做一个头像选择系统的页面，新注册的用户默认头像是1，显示头像的地方在聊天页面，聊天时消息旁边会有头像；其次消息列表和好友列表也有头像，好友的详细信息也会显示头像；好友列表的friendsList第一个固定是自己，点击自己的头像，右侧FriendDetail部分弹出头像选择组件（PhotoSelect.jsx 放到components 里），可以选择更换成picture中的其他图片做头像，我想的是吧picture的图片铺开有预览的然后让用户选择，然后右下角有一个确定按钮，摁下后将用户的头像更换为用户选定的（选定的头像右上角有一个对号的icon），注意，此时ChatpPage里用户的的头像保持同步。然后用户的详细信息哪里有两个组件我忘了写在之前的prompt里了，用户详细信息-用户信息的下方有两个按钮，如图所示，左边的是发消息，右面是删除好友，点击发消息会跳转到ChatPage，而且聊天对象是这个人，点击删除好友会弹出一个确认组件，“是否确定删除？”这个组件中有两个按钮，左边是灰色的取消，右边是红色的确认，删除好友的函数还没写，你给我写一句话先代替上吧。
