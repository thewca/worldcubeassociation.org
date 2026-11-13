# OIDC deploy roles for the other thewca repos, replacing the shared CI_CD_AWS_* access keys.
# Each role trusts the `production` GitHub environment of the listed repos.

locals {
  account_id = data.aws_caller_identity.current.account_id

  ecr_push_actions = [
    "ecr:BatchCheckLayerAvailability",
    "ecr:BatchGetImage",
    "ecr:CompleteLayerUpload",
    "ecr:GetDownloadUrlForLayer",
    "ecr:InitiateLayerUpload",
    "ecr:PutImage",
    "ecr:UploadLayerPart",
  ]

  github_deploy_other_repos = {
    wca-live = {
      repos = ["wca-live"]
      statements = [
        { actions = ["ecr:GetAuthorizationToken"], resources = ["*"] },
        { actions = local.ecr_push_actions, resources = ["arn:aws:ecr:${var.region}:${local.account_id}:repository/wca-live"] },
      ]
    }
    wca-documents = {
      repos = ["wca-documents"]
      statements = [
        { actions = ["s3:ListBucket"], resources = ["arn:aws:s3:::wca-documents"] },
        { actions = ["s3:PutObject", "s3:PutObjectAcl"], resources = ["arn:aws:s3:::wca-documents/*"] },
        { actions = ["cloudfront:CreateInvalidation"], resources = ["arn:aws:cloudfront::${local.account_id}:distribution/E31ELE3W069ZX7"] },
      ]
    }
    wca-regulations = {
      repos = ["wca-regulations"]
      statements = [
        { actions = ["s3:ListBucket"], resources = ["arn:aws:s3:::wca-regulations"] },
        { actions = ["s3:GetObject", "s3:PutObject", "s3:PutObjectAcl"], resources = ["arn:aws:s3:::wca-regulations/*"] },
      ]
    }
    wca-regulations-translations = {
      repos = ["wca-regulations-translations"]
      statements = [
        { actions = ["s3:ListBucket"], resources = ["arn:aws:s3:::wca-regulations"] },
        { actions = ["s3:PutObject", "s3:PutObjectAcl"], resources = ["arn:aws:s3:::wca-regulations/translations/*"] },
      ]
    }
  }
}

data "aws_iam_policy_document" "github_deploy_other_repos_assume_role" {
  for_each = local.github_deploy_other_repos

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [for repo in each.value.repos : "repo:thewca/${repo}:environment:production"]
    }
  }
}

data "aws_iam_policy_document" "github_deploy_other_repos" {
  for_each = local.github_deploy_other_repos

  dynamic "statement" {
    for_each = each.value.statements
    content {
      actions   = statement.value.actions
      resources = statement.value.resources
    }
  }
}

resource "aws_iam_role" "github_deploy_other_repos" {
  for_each = local.github_deploy_other_repos

  name               = "${each.key}-github-deploy-production"
  description        = "Assumed by GitHub Actions in the production environment of ${join(", ", formatlist("thewca/%s", each.value.repos))}"
  assume_role_policy = data.aws_iam_policy_document.github_deploy_other_repos_assume_role[each.key].json
}

resource "aws_iam_role_policy" "github_deploy_other_repos" {
  for_each = local.github_deploy_other_repos

  name   = "deploy"
  role   = aws_iam_role.github_deploy_other_repos[each.key].id
  policy = data.aws_iam_policy_document.github_deploy_other_repos[each.key].json
}
