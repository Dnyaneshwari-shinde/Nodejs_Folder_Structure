export default class ApiResponse<T> {
  readonly success = true;

  constructor(
    readonly message: string,
    readonly data: T,
  ) {}
}
