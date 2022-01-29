import * as path from 'path'
import * as fs from 'fs'
import * as vscode from 'vscode'
import * as crypto from 'crypto'

import { getTmpFolder, getClipboardContext, getCurrentRoot, edit } from '../utils'

export const paste = async () => {
  console.log("start action")
  try {
    const images = await getClipboardImages()
    const localImages = moveImagesToLocal(images)
    editMarkdownFile(localImages)
  } catch (err) {
    console.log(err)
  }
}

const getClipboardImages = async () => {
  let savePath = getTmpFolder()
  savePath = path.join(savePath, `pic_${new Date().getTime()}.png`)
  let images = await getClipboardContext(savePath)
  images = images.filter(img => ['.jpg', '.jpeg', '.gif', '.bmp', '.png', '.webp', '.svg'].find(ext => img.endsWith(ext)))

  if (!images.length) {
    const msg = '无法获取到剪切板中的图片信息，请先复制图片'
    vscode.window.showErrorMessage(msg)
    throw new Error(msg)
  }
  return images
}

const moveImagesToLocal = (images: string[]) => {
  const sha256 = crypto.createHash('sha256')
  const rootPath = getCurrentRoot()
  const imgLocalPath = vscode.workspace.getConfiguration('markdownHelper').get<string>('imgLocalPath') || ''
  return images.map(image => {
    const hash = sha256.update(fs.readFileSync(image)).digest('hex')
    const localUrl = path.resolve(rootPath, imgLocalPath, hash + path.extname(image))
    const localFolder = path.dirname(localUrl)
    if (!fs.existsSync(localFolder)) {
      fs.mkdirSync(localFolder)
    }
    fs.copyFileSync(image, localUrl)
    return localUrl
  })
}

const editMarkdownFile = async (images: string[]) => {
  const insertSrc = images.reduce((prev, current) => `${prev}![图片](${current})\n`, '')
  return edit(insertSrc)
}