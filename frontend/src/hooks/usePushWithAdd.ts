import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attemptsApi } from '@/lib/api';
import type { PushError, PushTaskAttemptRequest } from 'shared/types';

class PushErrorWithData extends Error {
  constructor(
    message: string,
    public errorData?: PushError
  ) {
    super(message);
    this.name = 'PushErrorWithData';
  }
}

export function usePushWithAdd(
  attemptId?: string,
  onSuccess?: () => void,
  onError?: (
    err: unknown,
    errorData?: PushError,
    params?: PushTaskAttemptRequest
  ) => void
) {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, PushTaskAttemptRequest>({
    mutationFn: async (params: PushTaskAttemptRequest) => {
      if (!attemptId) return;
      const result = await attemptsApi.pushWithAdd(attemptId, params);
      if (!result.success) {
        throw new PushErrorWithData(
          result.message || 'Push failed',
          result.error
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchStatus', attemptId] });
      onSuccess?.();
    },
    onError: (err, variables) => {
      console.error('Failed to push with add:', err);
      const errorData =
        err instanceof PushErrorWithData ? err.errorData : undefined;
      onError?.(err, errorData, variables);
    },
  });
}
