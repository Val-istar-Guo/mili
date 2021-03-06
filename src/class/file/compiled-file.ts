import { Resource, Effect } from '@/internal'
import { Encoding } from '@/consts'
import { diffFile } from '@/utils'
import { isNil } from 'ramda'


export interface CheckOptions {
  showDiff?: boolean
  fold?: boolean
}

export class CompiledFile {
  templatePath: string
  encoding: Encoding
  projectPath: string
  private projectContent?: string

  projectFileExisted: boolean
  content: string
  resource: Resource
  /** Delete project file */
  deleted = false
  /** Need to render file */
  renderable = true
  /** Additional file information that added by handler */
  addition = {}

  constructor(
    templatePath: string,
    content: string,
    encoding: Encoding,
    projectPath: string,
    resource: Resource,
    projectFileExisted: boolean,
  ) {
    this.templatePath = templatePath
    this.projectPath = projectPath
    this.projectFileExisted = projectFileExisted

    this.encoding = encoding
    this.content = content

    this.resource = resource
  }

  public async getProjectContent(): Promise<string> {
    const { projectPath, encoding } = this

    if (!isNil(this.projectContent)) return this.projectContent
    if (!this.projectFileExisted) throw new Error(`Cannot get content from an unexisted file ${projectPath}.`)

    this.projectContent = await Effect.fs.readFile(projectPath, encoding)
    return this.projectContent
  }

  public async render(): Promise<void> {
    if (this.deleted) {
      await Effect.fs.remove(this.projectPath)
      return
    }
    if (!this.renderable) return

    const { projectPath, content, encoding } = this
    await Effect.fs.writeFile(projectPath, content, encoding)
  }

  public async check(options: CheckOptions = {}): Promise<boolean> {
    const { projectPath, deleted, renderable, projectFileExisted } = this
    if (deleted && projectFileExisted) throw new Error(`${projectPath}: Should be removed`)
    if (!renderable) return true
    if (!projectFileExisted) throw new Error(`${projectPath}: Not exist`)

    const projectContent = await this.getProjectContent()
    if (this.content === projectContent) return true

    if (options.showDiff) {
      const diff = diffFile(this.projectPath, projectContent, this.content, { fold: options.fold })
      throw new Error(diff)
    } else {
      throw new Error(`${projectPath}: Not match template.`)
    }
  }
}

export type CompiledFiles = CompiledFile[]
