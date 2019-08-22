module.exports = {
    plugins: {
      'autoprefixer': {

      },
      'postcss-font-magician': {
        variants: {
          'Raleway': {
            '300': [],
            '400': [],
            '700': []
          },
          'Merriweather': {
            '300': [],
            '400': [],
            '700': []
          },
        },
        foundries: ['google']
      }
    }
  }