import { supabase } from "../supabase";

export const voteService = {
  async voteOnPost(postId: string, voteType: "upvote" | "downvote") {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select()
      .eq("user_id", user.user.id)
      .eq("post_id", postId)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking the same vote type
        await supabase.from("votes").delete().eq("id", existingVote.id);

        // Update post vote counts
        if (voteType === "upvote") {
          await supabase.rpc("decrement_upvotes", { post_id: postId });
        } else {
          await supabase.rpc("decrement_downvotes", { post_id: postId });
        }

        return null;
      } else {
        // Change vote type
        await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id);

        // Update post vote counts
        if (voteType === "upvote") {
          await supabase.rpc("increment_upvotes", { post_id: postId });
          await supabase.rpc("decrement_downvotes", { post_id: postId });
        } else {
          await supabase.rpc("decrement_upvotes", { post_id: postId });
          await supabase.rpc("increment_downvotes", { post_id: postId });
        }

        return voteType;
      }
    } else {
      // Create new vote
      await supabase.from("votes").insert({
        user_id: user.user.id,
        post_id: postId,
        vote_type: voteType,
      });

      // Update post vote counts
      if (voteType === "upvote") {
        await supabase.rpc("increment_upvotes", { post_id: postId });
      } else {
        await supabase.rpc("increment_downvotes", { post_id: postId });
      }

      return voteType;
    }
  },

  async voteOnComment(commentId: string, voteType: "upvote" | "downvote") {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("votes")
      .select()
      .eq("user_id", user.user.id)
      .eq("comment_id", commentId)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote if clicking the same vote type
        await supabase.from("votes").delete().eq("id", existingVote.id);

        // Update comment vote counts
        if (voteType === "upvote") {
          await supabase.rpc("decrement_comment_upvotes", {
            comment_id: commentId,
          });
        } else {
          await supabase.rpc("decrement_comment_downvotes", {
            comment_id: commentId,
          });
        }

        return null;
      } else {
        // Change vote type
        await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("id", existingVote.id);

        // Update comment vote counts
        if (voteType === "upvote") {
          await supabase.rpc("increment_comment_upvotes", {
            comment_id: commentId,
          });
          await supabase.rpc("decrement_comment_downvotes", {
            comment_id: commentId,
          });
        } else {
          await supabase.rpc("decrement_comment_upvotes", {
            comment_id: commentId,
          });
          await supabase.rpc("increment_comment_downvotes", {
            comment_id: commentId,
          });
        }

        return voteType;
      }
    } else {
      // Create new vote
      await supabase.from("votes").insert({
        user_id: user.user.id,
        comment_id: commentId,
        vote_type: voteType,
      });

      // Update comment vote counts
      if (voteType === "upvote") {
        await supabase.rpc("increment_comment_upvotes", {
          comment_id: commentId,
        });
      } else {
        await supabase.rpc("increment_comment_downvotes", {
          comment_id: commentId,
        });
      }

      return voteType;
    }
  },
};
