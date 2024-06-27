import mdattrs from 'markdown-it-attrs'
import mdsub from 'markdown-it-sub'

export default function (eleventyConfig) {
  eleventyConfig.ignores.add('parts')

  eleventyConfig.addPassthroughCopy('style/*.css')
  eleventyConfig.amendLibrary('md', (mdLib) => {
    mdLib.use(mdattrs)
    mdLib.use(mdsub)
  })
  return {
    dir: {
      input: 'web',
    },
  }
}
