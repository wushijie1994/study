const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');/*配置模块的热替换*/
const webpack = require('webpack');

const portfinder = require('portfinder')/*端口查找器，默认从8080开始到最大值65535*/
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')

/*导入配置文件*/
const config=require('../config/index');
const util=require('./util');

/*process是node的全局变量*/
const HOST = process.env.HOST
const PORT = process.env.PORT && Number(process.env.PORT)

const webpackDevConfig = {
    entry: {
        app: './src/index.js'
    },
    devtool: 'inline-source-map',
    devServer: {
        clientLogLevel: 'warning',
        /*你要提供哪里的内容给虚拟服务器用。这里最好填 绝对路径。*/
        contentBase: false,
        // contentBase: './dist',
        /*如果为 true ，页面出错不会弹出 404 页面。*/
        historyApiFallback: true,
        /*热模块更新作用。即修改或模块后，保存会自动更新，页面不用刷新呈现最新的效果。*/
        hot: true,
        inline: true,
        progress: true,
        /*写主机名的。默认 localhost*/
        host:HOST||config.dev.host,
        port:PORT||config.dev.port, //端口你可以自定义
        /*如果为 true ，开启虚拟服务器时，为你的代码进行压缩。加快开发流程和优化的作用。*/
        compress:true,
        open:true,/*是否自动打开浏览器*/
        quiet: true, //true，则终端输出的只有初始启动信息。 webpack 的警告和错误是不输出到终端的。
        overlay: {
            errors: true,
            warnings: false
        },
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env': 'development'
        }),
        new CleanWebpackPlugin(['dist']),
        /*配置html插件*/
        new HtmlWebpackPlugin({
            title:'webpackServer',
            filename: 'index.html',
            template: 'index.html',
            inject: true
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};

module.exports=new Promise((resolve, reject) => {
    /*自定义接口的实现*/
    portfinder.basePort = process.env.PORT || config.dev.port;
    portfinder.getPort((err, port)=>{
        if(err){
            reject(err)
        }else{
            process.env.PORT=port;
            webpackDevConfig.devServer.port=port;

            webpackDevConfig.plugins.push(new FriendlyErrorsPlugin({
                compilationSuccessInfo: {
                    messages: [`You application is running here http://${process.env.host}:${port}`],
                },
                onErrors:util.createNotifierCallback
            }))

            resolve(webpackDevConfig)
        }
    })
});