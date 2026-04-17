-- Add missing DELETE policy for friendships table
-- Both parties (requester and addressee) should be able to delete a friendship
-- (cancel request, reject request, remove friend, unblock)
CREATE POLICY "Users can delete friendships"
  ON friendships
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
