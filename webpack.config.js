const { resolve } = require( 'path' );

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'asteroids.js',
        path: resolve( __dirname, 'dist' )
    },
    devServer: {
        static: {
        directory: resolve( __dirname, 'dist' )
        }
    },
    target: 'web',
    mode: 'production'
}