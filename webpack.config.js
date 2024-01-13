const { resolve } = require( 'path' );

module.exports = {
    entry: './src/main.ts',
    output: {
        filename: 'asteroids.js',
        path: resolve( __dirname, 'dist' )
    },
    devServer: {
        static: {
        directory: resolve( __dirname, 'dist' )
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_module/,
                use: 'ts-loader'
            }
        ]
    },
    resolve: {
        extensions: [ '.ts', '.js']
    },
    target: 'web',
    mode: 'production'
}