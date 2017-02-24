import {ScriptTarget} from 'typescript';

import {TransformOptions, transform} from 'babel-core';

import {TranspileException} from '../../exception';
import {transpileCache} from '../cache';
import {TranspileResult} from '../transpile';
import {evaluateModule} from '../evaluate';

export const compilejs = <R>(module: NodeModule, source: string): TranspileResult<R> =>
  transpileCache.read(module.filename, () => factory<R>(module, source));

const factory = <R>(module: NodeModule, source: string): TranspileResult<R> => {
  const filename = module.filename;

  const sourceType = ScriptTarget.ES2015;

  try {
    const transformOptions: TransformOptions = {
      presets: [sourceToPreset(sourceType)].map(require.resolve),
      sourceMaps: 'inline',
      compact: true,
      filename,
    };

    const {code} = transform(source, transformOptions);
    if (code == null) {
      throw new TranspileException(`Catastrophic transpilation error: ${module.id}`);
    }

    return evaluateModule<R>(module, code);
  }
  catch (exception) {
    throw new TranspileException(`Transpilation of ${module.id} failed`, exception);
  }
};

const sourceToPreset = (sourceType: ScriptTarget): string => {
  switch (sourceType) {
    case ScriptTarget.ES2015:
      return 'babel-preset-es2015';
    default:
      throw new TranspileException(`${ScriptTarget[sourceType]} not supported by installed Babel plugins`);
  }
};
