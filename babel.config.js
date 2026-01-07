module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                        '@/hooks': './src/hooks',
                        '@/lib': './src/lib',
                        '@/components': './src/components',
                        '@/store': './src/store',
                        '@/services': './src/services',
                        '@/types': './src/types',
                        '@/utils': './src/utils',
                        '@/config': './src/config',
                    },
                    extensions: [
                        '.ios.ts',
                        '.android.ts',
                        '.ts',
                        '.ios.tsx',
                        '.android.tsx',
                        '.tsx',
                        '.jsx',
                        '.js',
                        '.json',
                    ],
                },
            ],
            'react-native-reanimated/plugin', // Must be last
        ],
    };
};