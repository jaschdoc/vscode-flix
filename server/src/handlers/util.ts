import * as jobs from '../engine/jobs'
import * as engine from '../engine'
import * as socket from '../engine/socket'
import { hasErrors } from '../server'

export function makeDefaultResponseHandler (promiseResolver: Function) {
  return function responseHandler ({ status, result }: socket.FlixResponse) {
    if (status === 'success') {
      promiseResolver(result)
    } else {
      promiseResolver()
    }
  }
}

export function makeEnqueuePromise (type: jobs.Request, makeResponseHandler?: Function, uri?: string, position?: any) {
  return function enqueuePromise () {
    return new Promise(function (resolve) {
      const job = engine.enqueueJobWithPosition(type, uri, position)
      const handler = makeResponseHandler || makeDefaultResponseHandler
      socket.eventEmitter.once(job.id, handler(resolve))
    })
  }
}

export function makePositionalHandler (type: jobs.Request, handlerWhenErrorsExist?: Function, makeResponseHandler?: Function) {
  return function positionalHandler (params: any): Thenable<any> {
    if (hasErrors() && handlerWhenErrorsExist) {
      // NOTE: At present this isn't used by anyone (neither is makeResponseHandler)
      return handlerWhenErrorsExist()
    }
    const uri = params.textDocument ? params.textDocument.uri : undefined
    const position = params.position
    return makeEnqueuePromise(type, makeResponseHandler, uri, position)()
  }
}