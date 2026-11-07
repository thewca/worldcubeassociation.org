resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

locals {
  github_deploy_environments = {
    staging = {
      service_prefix = "${var.name_prefix}-staging"
      asset_bucket   = "assets-staging.worldcubeassociation.org"
      exec_container = "rails-staging"
    }
    production = {
      service_prefix = "${var.name_prefix}-prod"
      asset_bucket   = "assets.worldcubeassociation.org"
      exec_container = null
    }
  }
}

data "aws_iam_policy_document" "github_deploy_assume_role" {
  for_each = local.github_deploy_environments

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
      values   = ["repo:thewca/worldcubeassociation.org:environment:${each.key}"]
    }
  }
}

data "aws_iam_policy_document" "github_deploy" {
  for_each = local.github_deploy_environments

  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [aws_ecr_repository.this.arn, aws_ecr_repository.nextjs.arn]
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${each.value.asset_bucket}", "arn:aws:s3:::wca-fonts"]
  }

  statement {
    actions   = ["s3:PutObject"]
    resources = ["arn:aws:s3:::${each.value.asset_bucket}/*"]
  }

  statement {
    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::wca-fonts/*"]
  }

  statement {
    actions   = ["ecs:UpdateService"]
    resources = ["arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:service/${aws_ecs_cluster.this.name}/${each.value.service_prefix}*"]
  }

  dynamic "statement" {
    for_each = each.value.exec_container == null ? [] : [each.value.exec_container]

    content {
      actions   = ["ecs:ListTasks"]
      resources = ["*"]

      condition {
        test     = "ArnEquals"
        variable = "ecs:cluster"
        values   = [aws_ecs_cluster.this.arn]
      }
    }
  }

  dynamic "statement" {
    for_each = each.value.exec_container == null ? [] : [each.value.exec_container]

    content {
      actions = ["ecs:ExecuteCommand"]
      resources = [
        aws_ecs_cluster.this.arn,
        "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:task/${aws_ecs_cluster.this.name}/*",
      ]

      condition {
        test     = "StringEquals"
        variable = "ecs:container-name"
        values   = [statement.value]
      }
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  for_each = local.github_deploy_environments

  name               = "${var.name_prefix}-github-deploy-${each.key}"
  description        = "Assumed by GitHub Actions in the ${each.key} environment of thewca/worldcubeassociation.org"
  assume_role_policy = data.aws_iam_policy_document.github_deploy_assume_role[each.key].json
}

resource "aws_iam_role_policy" "github_deploy" {
  for_each = local.github_deploy_environments

  name   = "deploy"
  role   = aws_iam_role.github_deploy[each.key].id
  policy = data.aws_iam_policy_document.github_deploy[each.key].json
}
