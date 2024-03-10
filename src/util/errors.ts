export class ErrorBase<T extends string> extends Error {
  name: T;
  message: string;
  cause: any;

  constructor({
    name,
    message,
    cause,
  }: {
    name: T;
    message: string;
    cause?: any;
  }) {
    super();
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}

export type CommandHandleErrorName =
  | 'AUTOCOMPLETE_NOT_FOUND'
  | 'AUTOCOMPLETE_THROWN'
  | 'COMMAND_NOT_FOUND'
  | 'COMMAND_THROWN'
  | 'MENU_NOT_FOUND'
  | 'MENU_THROWN'
  | 'LACKING_PRIVILIGES';

export type ComponentHandleErrorName =
  | 'THROW_COMPONENT_TRIGGERED'
  | 'OUTDATED_COMPONENT_TRIGGERED'
  | 'COMPONENT_NOT_FOUND'
  | 'INSTANCE_NOT_FOUND'
  | 'DISALLOWED_USER'
  | 'COMPONENT_THROWN';

export type HandleErrorName = 'GUILD_NOT_CACHED';

export class HandleError<T extends string> extends ErrorBase<
  T | HandleErrorName
> {}
export class CommandHandleError extends HandleError<CommandHandleErrorName> {}
export class ComponentHandleError extends HandleError<ComponentHandleErrorName> {}
